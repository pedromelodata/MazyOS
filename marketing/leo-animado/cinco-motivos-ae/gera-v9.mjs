// Gera o monta-v9.jsx: a BASE do reel "Cinco motivos pra ter CNPJ" (v9) no After Effects, a pedido do Pedro (13/10/2026):
// "construa toda a base pelo After effects e logo após isso refine com o Remotion o que precisa".
// O AE monta tudo o que é 2D: fundo, cenas, números grandes, legenda com karaokê e pulinhos, fecho, com o motion blur
// nativo dele. O desenho e as curvas são os da v8 do Remotion (src/cinco/CincoMotivos.tsx): cada movimento virou uma
// expressão do AE com a mesma conta (pr, eBack, eInOut...), então o tempo de cada coisa é o mesmo da v8.
// Fica pro Remotion (CincoV9.tsx): o iPhone 17 Pro Max 3D (o AE desta máquina não renderiza modelo 3D), o som e o
// acabamento.
// Tempos: legenda.json do Remotion (palavras com o tempo da voz da v7, deslocamento D e blocos da legenda).
// Uso: node gera-v9.mjs   (grava monta-v9.jsx; só ASCII, acentos em \uXXXX)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { simbolo } from "../sufoco-linha-ae/simbolo.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");
const LEG = JSON.parse(fs.readFileSync(path.resolve(AQUI, "../precificacao-2026-10-02/remotion/src/cinco/legenda.json"), "utf8"));
const D = LEG.desloca, WORDS = LEG.words, BLOCOS = LEG.blocos;
const FPS = 30, QUADROS = 1299 + Math.round(D * 30), DUR = QUADROS / FPS;
const NB = " ";
const C = {
  ink: "#15171C", ink2: "#1D2027", ink3: "#262A33", linha: "#383C48", papel: "#FAF8F5", creme: "#F3EDE4",
  coral: "#F2643C", coral6: "#DD4E27", coral7: "#B83D1C", cinza: "#9AA0AA", cinzaPapel: "#DCD6CE", inkF: "#1B1E24",
};
const Y_LEG = 1480, LARG_LEG = 888;
const r3 = (x) => {
  if (!Number.isFinite(x)) throw new Error("número inválido no gerador");
  return Math.round(x * 1000) / 1000;
};
const J = (v) => JSON.stringify(v, (k, x) => (typeof x === "number" ? r3(x) : x));
const nrm = (s) => s.replace(/[^\p{L}\p{N}%.]/gu, "").replace(/\.$/, "").toLowerCase();
const S = (txt, n = 1) => { let c = 0; for (const w of WORDS) if (nrm(w.t) === nrm(txt) && ++c === n) return w.s; throw new Error("palavra " + txt); };
const E = (txt, n = 1) => { let c = 0; for (const w of WORDS) if (nrm(w.t) === nrm(txt) && ++c === n) return w.e; throw new Error("palavra " + txt); };

const RAIOS = [S("Cinco"), S("Um") - 0.03, S("Dois"), S("Três"), S("Quatro"), S("Cinco", 2), S("gente")];
const IMPACTOS = [S("CPF") + 0.07, S("Cinco") + 0.09, S("6%") + 0.04, S("6.750") + 0.08, S("gente") + 0.05];
const TROCAS = [S("Um") - 0.08, S("Dois") - 0.08, S("Três") - 0.08, S("Quatro") - 0.08, S("Cinco", 2) - 0.08, 33.42 + D];

// ---------- a biblioteca das expressões (as contas da v8) ----------
const XL = [
  "function cl(x){return Math.min(1,Math.max(0,x));}",
  "function pr(t,t0,d){return cl((t-t0)/d);}",
  "function lerp(a,b,x){return a+(b-a)*x;}",
  "function eOut(x){return 1-Math.pow(1-x,4);}",
  "function eIn(x){return x*x*x;}",
  "function eInOut(x){return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}",
  "function eBack(x,s){if(s===undefined){s=1.45;}var y=x-1;return 1+(s+1)*y*y*y+s*y*y;}",
  `function tremida(t){var I=${J(IMPACTOS)};var dx=0,dy=0;for(var i=0;i<I.length;i++){var u=(t-I[i])/0.28;if(u<0||u>=1){continue;}var amp=6*(1-u)*(1-u);dx+=amp*Math.sin(2*Math.PI*22*(t-I[i]));dy+=amp*0.6*Math.cos(2*Math.PI*19*(t-I[i]));}return [dx,dy];}`,
  "function br(n){var s=String(Math.round(n));var o='';while(s.length>3){o='.'+s.slice(s.length-3)+o;s=s.slice(0,s.length-3);}return s+o;}",
  "function salto(t,t0){if(t<t0){return 0;}if(t<t0+0.08){return eOut(pr(t,t0,0.08));}return 1-eInOut(pr(t,t0+0.08,0.18));}",
].join("");
const X = (corpo) => J(XL + "var t=time;" + corpo);

// ---------- saída JSX ----------
const out = [];
let nEmit = 0;
// cada instrução vai num try com o número dela no log: uma falha não abre a janela de erro do AE (que trava tudo até
// alguém clicar OK) e o log diz exatamente qual foi
const CRU = /^(var PECA|var DUR|\s*var LOG|app\.beginSuppressDialogs|try \{$|\} catch \(e\) \{ log\("ERRO|app\.endSuppressDialogs)/;
const emit = (s) => {
  nEmit++;
  out.push(CRU.test(s) ? s : `try { ${s} } catch (e) { log("FALHA ${nEmit}: " + msg(e) + " | " + ${JSON.stringify(s.slice(0, 90))}); }`);
  if (nEmit % 150 === 0) out.push("try { app.purge(PurgeTarget.ALL_CACHES); } catch (e) {}");
};
let nVar = 0;
const nv = (p = "v") => `${p}${nVar++}`;
const nomes = new Set();
const nome = (n) => { if (nomes.has(n)) throw new Error("nome repetido: " + n); nomes.add(n); return n; };

const LIB = String.raw`
var LOG = [];
var LOGF = new File(PECA + "/monta-v9.log");
function log(s) { LOG.push(String(s)); try { LOGF.open("a"); LOGF.writeln(String(s)); LOGF.close(); } catch (e) {} }
// o AE devolve erros que quebram ao virar texto ("" + e): o log do erro derrubava o script inteiro
function msg(e) { try { return String(e.message); } catch (x) { try { return String(e); } catch (y) { return "erro sem texto"; } } }
function linha(e) { try { return String(e.line); } catch (x) { return "?"; } }
function hx(c) { return [parseInt(c.substr(1, 2), 16) / 255, parseInt(c.substr(3, 2), 16) / 255, parseInt(c.substr(5, 2), 16) / 255]; }
function hx4(c) { var a = hx(c); a.push(1); return a; }
function raiz(L) { return L.property("ADBE Root Vectors Group"); }
function H(L, ix) { return { L: L, ix: ix }; }
function contDe(h) { var p = raiz(h.L); for (var k = 0; k < h.ix.length; k++) p = p.property(h.ix[k]).property("ADBE Vectors Group"); return p; }
function grupoDe(h) { var p = raiz(h.L), q = null; for (var k = 0; k < h.ix.length; k++) { q = p.property(h.ix[k]); p = q.property("ADBE Vectors Group"); } return q; }
function grp(pai, nome) { var c = contDe(pai); var q = c.addProperty("ADBE Vector Group"); if (nome) q.name = nome; var ix = q.propertyIndex; return H(pai.L, pai.ix.concat([ix])); }
function its(h) { return contDe(h); }
function tfg(h) { return grupoDe(h).property("ADBE Vector Transform Group"); }
function ret(g, w, h, r, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Rect"); p.property("ADBE Vector Rect Size").setValue([w, h]); p.property("ADBE Vector Rect Position").setValue([x || 0, y || 0]); p.property("ADBE Vector Rect Roundness").setValue(r || 0); return p; }
function eli(g, w, h, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Ellipse"); p.property("ADBE Vector Ellipse Size").setValue([w, h]); p.property("ADBE Vector Ellipse Position").setValue([x || 0, y || 0]); return p; }
function forma(v, it, ot, fech) { var s = new Shape(); s.vertices = v; s.inTangents = it; s.outTangents = ot; s.closed = fech; return s; }
function cam(g, v, it, ot, fech) { var p = its(g).addProperty("ADBE Vector Shape - Group"); p.property("ADBE Vector Shape").setValue(forma(v, it, ot, fech)); return p; }
function poli(g, v, fech) { var z = []; for (var i = 0; i < v.length; i++) z.push([0, 0]); return cam(g, v, z, z, fech); }
function fil(g, c, op) { var f = its(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(hx(c)); if (op != null) f.property("ADBE Vector Fill Opacity").setValue(op); return f; }
function trc(g, c, w, op) { var s = its(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(hx(c)); s.property("ADBE Vector Stroke Width").setValue(w); s.property("ADBE Vector Stroke Line Cap").setValue(2); s.property("ADBE Vector Stroke Line Join").setValue(2); if (op != null) s.property("ADBE Vector Stroke Opacity").setValue(op); return s; }
function apa(g) { return its(g).addProperty("ADBE Vector Filter - Trim"); }
function tl(L) { return L.property("ADBE Transform Group"); }
function novaForma(comp, nome, x, y) { var L = comp.layers.addShape(); L.name = nome; tl(L).property("ADBE Anchor Point").setValue([0, 0]); tl(L).property("ADBE Position").setValue([x || 0, y || 0]); return L; }
function efeito(L, nome) { return L.property("ADBE Effect Parade").addProperty(nome); }
function cor4(p, c) { try { p.setValue(hx4(c)); } catch (e) { p.setValue(hx(c)); } }
function sombra(L, c, op, dist, suav) { var f = efeito(L, "ADBE Drop Shadow"); cor4(f.property("ADBE Drop Shadow-0001"), c); f.property("ADBE Drop Shadow-0002").setValue(op); f.property("ADBE Drop Shadow-0003").setValue(180); f.property("ADBE Drop Shadow-0004").setValue(dist); f.property("ADBE Drop Shadow-0005").setValue(suav); return f; }
function desfoque(L, v) { var f = efeito(L, "ADBE Gaussian Blur 2"); f.property("ADBE Gaussian Blur 2-0001").setValue(v); try { f.property("ADBE Gaussian Blur 2-0003").setValue(1); } catch (e) {} return f; }
function texto(comp, nome, txt, fonte, tam, c, just, track) {
  var L = comp.layers.addText(txt); L.name = nome;
  var P = L.property("ADBE Text Properties").property("ADBE Text Document");
  var d = P.value;
  try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
  d.text = txt; d.font = fonte; d.fontSize = tam; d.applyFill = true; d.fillColor = hx(c); d.applyStroke = false;
  d.justification = just; d.tracking = track || 0;
  P.setValue(d);
  return L;
}
function contorno(L, c, w) { var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var d = P.value; d.applyFill = false; d.applyStroke = true; d.strokeColor = hx(c); d.strokeWidth = w; P.setValue(d); }
function centra(L) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]); return r; }
function ancora(L, fx, fy) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width * fx, r.top + r.height * fy]); return r; }
function importa(c) { return app.project.importFile(new ImportOptions(new File(c))); }
// o espaço da Sora no AE sai uns 5 px mais estreito que no Chrome (v8): tracking nos espaços da legenda, senão a palavra
// que pula encosta na vizinha
function respiro(L, idx, tr) { var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var d = P.value; for (var i = 0; i < idx.length; i++) d.characterRange(idx[i], idx[i] + 1).tracking = tr; P.setValue(d); }
function enfase(L, a, b, e0, e1) { var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var d = P.value; var cr = d.characterRange(a, b); cr.font = FONTE_ENF; cr.fontSize = TAM_ENF; cr.tracking = 0; if (e0) d.characterRange(a, a + 1).tracking = 140; if (e1) d.characterRange(b - 1, b).tracking = 140; P.setValue(d); }
function legPos(L, y, larg) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width / 2, 0]); tl(L).property("ADBE Position").setValue([540, y]); if (r.width > larg) { var k = 100 * larg / r.width; tl(L).property("ADBE Scale").setValue([k, k, 100]); } var mo = L.property("ADBE Text Properties").property("ADBE Text More Options"); mo.property("ADBE Text Anchor Point Option").setValue(2); mo.property("ADBE Text Anchor Point Align").setValue([0, -30]); }
// conferência no fim: anda por todas as propriedades de novo (guardar a propriedade na hora de pôr a expressão não
// serve: o addProperty seguinte no mesmo grupo invalida a referência), lê o erro de cada expressão e testa o valor em
// três tempos da vida da camada
function curto(s) { s = String(s).split(String.fromCharCode(13)).join(" ").split(String.fromCharCode(10)).join(" "); return s.length > 240 ? s.substr(0, 240) + "..." : s; }
function ruim(v) { if (typeof v === "number") return !isFinite(v); if (v && v.length !== undefined && typeof v !== "string") { for (var i = 0; i < v.length; i++) if (typeof v[i] === "number" && !isFinite(v[i])) return true; } return false; }
var CONF = { n: 0, err: 0, nan: 0 };
function anda(L, g, cam) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p; try { p = g.property(i); } catch (e) { continue; }
    if (!p) continue;
    var nome = cam + "/" + p.name;
    if (p.propertyType === PropertyType.PROPERTY) {
      var tem = false; try { tem = p.canSetExpression && p.expression !== ""; } catch (e) {}
      if (!tem) continue;
      CONF.n++;
      var er = ""; try { er = p.expressionError; } catch (e) { er = "ler: " + msg(e); }
      if (er) { CONF.err++; if (CONF.err <= 40) log("EXPR ERRO " + L.name + " :: " + nome + " :: " + curto(er)); continue; }
      var ts = [L.inPoint + 0.05, (L.inPoint + L.outPoint) / 2, L.outPoint - 0.05];
      for (var k = 0; k < ts.length; k++) {
        try { if (ruim(p.valueAtTime(ts[k], false))) { CONF.nan++; if (CONF.nan <= 40) log("EXPR NaN " + L.name + " :: " + nome + " t=" + ts[k].toFixed(2)); break; } }
        catch (e) { CONF.err++; if (CONF.err <= 40) log("EXPR AVAL " + L.name + " :: " + nome + " t=" + ts[k].toFixed(2) + " :: " + curto(msg(e))); break; }
      }
    } else { try { anda(L, p, nome); } catch (e) { log("grupo " + nome + ": " + msg(e)); } }
  }
}
function confere() {
  for (var c = 1; c <= app.project.numItems; c++) {
    var it = app.project.item(c);
    if (!(it instanceof CompItem)) continue;
    for (var l = 1; l <= it.numLayers; l++) { var L = it.layer(l); try { anda(L, L, ""); } catch (e) { log("camada " + L.name + ": " + msg(e)); } }
  }
  log("expressoes: " + CONF.n + ", com erro: " + CONF.err + ", NaN: " + CONF.nan);
}
var EXPRS = [];
function X(p, s) { try { p.expression = s; EXPRS.push(p); } catch (e) { log("expr erro: " + msg(e)); } }
function vida(L, t0, t1) { L.inPoint = Math.max(0, t0); L.outPoint = Math.min(DUR, t1 + 0.02); }
// prender na mãe: o AE compensa escala e giro pelos da mãe no quadro atual (mãe entrando em zoom = filha 1,2x a 5x maior),
// então guarda os dois antes e devolve depois
function filho(Lf, Lp, x, y) { var T = tl(Lf), s = T.property("ADBE Scale").value, r = T.property("ADBE Rotate Z").value; Lf.parent = Lp; T.property("ADBE Scale").setValue(s); T.property("ADBE Rotate Z").setValue(r); T.property("ADBE Position").setValue([x, y]); }
`;

// ---------- ajudantes do lado do Node ----------
const VAR = {}; // nome da camada -> variável JSX
// a entrada e a saída da v8 (Anim), a flutuação (Flutua) e a tremida, como expressões de uma camada
function anim(L, nomeL, o) {
  const { x, y, t0, t1, ent = "baixo", sai = "esq", dist = 150, din = 0.26, dout = 0.16, rot0 = 0, op = 1, flu = null, treme = true, escExtra = "1", rotExtra = "0" } = o;
  const s0 = o.esc0 ?? (ent === "slam" ? 1.8 : ent === "zoom" ? 0.35 : 0.84);
  const head = `var a=pr(t,${r3(t0)},${r3(din)}),b=pr(t,${r3(t1 - dout)},${r3(dout)});var ea=eBack(a),k=1-ea,eb=eIn(b);`;
  const fl = flu ? { a: flu.a ?? 7, r: flu.r ?? 1.2, ph: flu.ph ?? 0, f: flu.f ?? 0.42 } : null;
  let pos = head + "var dx=0,dy=0;";
  if (ent === "baixo") pos += `dy+=${dist}*k;`;
  if (ent === "cima") pos += `dy-=${dist}*k;`;
  if (ent === "esq") pos += `dx-=${dist}*k;`;
  if (ent === "dir") pos += `dx+=${dist}*k;`;
  if (sai === "esq") pos += "dx-=240*eb;";
  if (sai === "dir") pos += "dx+=240*eb;";
  if (sai === "cima") pos += "dy-=220*eb;";
  if (sai === "baixo") pos += "dy+=220*eb;";
  if (fl) pos += `dy+=${fl.a}*Math.sin(2*Math.PI*${fl.f}*t+${fl.ph});`;
  if (treme) pos += "var q=tremida(t);dx+=q[0];dy+=q[1];";
  pos += `[${r3(x)}+dx,${r3(y)}+dy]`;
  const esc = head + `var s=lerp(${s0},1,ea)*lerp(1,${sai === "zoom" ? 0.5 : 0.9},eb)*(${escExtra});[s*100,s*100]`;
  const rot = head + `${rot0}*k` + (fl ? `+${fl.r}*Math.sin(2*Math.PI*${fl.f}*0.73*t+${fl.ph}+1.3)` : "") + `+(${rotExtra})`;
  const opa = head + `${op}*cl(a/0.25)*(1-cl((b-0.55)/0.45))*100`;
  emit(`X(tl(${L}).property("ADBE Position"), ${X(pos)});`);
  emit(`X(tl(${L}).property("ADBE Scale"), ${X(esc)});`);
  emit(`X(tl(${L}).property("ADBE Rotate Z"), ${X(rot)});`);
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(opa)});`);
  emit(`vida(${L}, ${r3(t0)}, ${r3(t1)}); ${L}.motionBlur = true;`);
  VAR[nomeL] = L;
}
// camada filha: anda com a mãe (o AE não herda a opacidade, então ela vem por expressão)
function filha(Lf, nomeMae, x, y, opExtra = "100") {
  emit(`filho(${Lf}, ${VAR[nomeMae]}, ${r3(x)}, ${r3(y)}); ${Lf}.motionBlur = true;`);
  emit(`X(tl(${Lf}).property("ADBE Opacity"), ${X(`thisComp.layer(${J(nomeMae)}).transform.opacity*(${opExtra})/100`)});`);
}
function forma(nomeL, comp = "COMP", x = 0, y = 0) { const L = nv("F"); emit(`var ${L} = novaForma(${comp}, ${J(nome(nomeL))}, ${r3(x)}, ${r3(y)});`); return L; }
function grupo(L, n) { const g = nv("g"); emit(`var ${g} = grp(H(${L}, []), ${J(n)});`); return g; }
function txt(nomeL, s, fonte, tam, cor, o = {}) {
  const L = nv("T");
  emit(`var ${L} = texto(${o.comp ?? "COMP"}, ${J(nome(nomeL))}, ${J(s)}, ${fonte}, ${tam}, "${cor}", ParagraphJustification.${o.just ?? "CENTER_JUSTIFY"}, ${o.track ?? 0});`);
  if (o.anc) emit(`ancora(${L}, ${o.anc[0]}, ${o.anc[1]});`);
  else emit(`centra(${L});`);
  return L;
}
// a âncora que acompanha o texto que muda (contadores)
const ancoraViva = (L, fx, fy) => emit(`X(tl(${L}).property("ADBE Anchor Point"), ${J(`var r=sourceRectAtTime(time,false);[r.left+r.width*${fx},r.top+r.height*${fy}]`)});`);
const arcoP = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [r3(cx + r * Math.cos(a)), r3(cy + r * Math.sin(a))]; });
const retV = (cx, cy, w, h, r) => [...arcoP(cx + w / 2 - r, cy - h / 2 + r, r, -90, 0, 4), ...arcoP(cx + w / 2 - r, cy + h / 2 - r, r, 0, 90, 4), ...arcoP(cx - w / 2 + r, cy + h / 2 - r, r, 90, 180, 4), ...arcoP(cx - w / 2 + r, cy - h / 2 + r, r, 180, 270, 4)];
// ícone de traço que se desenha: [vértices, fechado] e a expressão do "trim end" (0 a 100)
function traco(L, partes, cor, larg, progExpr) {
  const g = grupo(L, "traço");
  partes.forEach(([v, fech]) => emit(`poli(${g}, ${J(v)}, ${fech ? "true" : "false"});`));
  emit(`trc(${g}, "${cor}", ${larg}, 100);`);
  const tp = nv("tp");
  emit(`var ${tp} = apa(${g});`);
  emit(`X(${tp}.property("ADBE Vector Trim End"), ${X(progExpr)});`);
}
// cartão de vidro escuro: corpo, filete claro no topo, contorno fino e sombra
function cartaoForma(L, w, h, r) {
  const g1 = grupo(L, "brilho do topo"); emit(`ret(${g1}, ${w - 2 * r}, 2, 1, 0, ${-h / 2 + 2}); fil(${g1}, "#FFFFFF", 13);`);
  const g2 = grupo(L, "corpo"); emit(`ret(${g2}, ${w}, ${h}, ${r}, 0, 0); fil(${g2}, "${C.ink2}", 94); trc(${g2}, "${C.linha}", 2, 100);`);
  emit(`sombra(${L}, "#000000", 55, 22, 60);`);
}
function simboloForma(L, tam) {
  const s = simbolo(tam, 0, 0);
  const g1 = grupo(L, "visto"); emit(`cam(${g1}, ${J(s.v)}, ${J(s.i)}, ${J(s.o)}, true); fil(${g1}, "#FFFFFF");`);
  const g2 = grupo(L, "quadrado"); emit(`ret(${g2}, ${tam}, ${tam}, ${s.raio}, 0, 0); fil(${g2}, "${C.coral}");`);
}
// o visto da marca que entra girando (SimboloPop da v8)
function simboloPop(nomeL, x, y, tam, t0, t1, o = {}) {
  const L = forma(nomeL);
  simboloForma(L, tam);
  anim(L, nomeL, { x, y, t0, t1, ent: "zoom", esc0: 0, rot0: -28, din: 0.24, sai: o.sai ?? "esq", flu: o.flu ?? null });
  return L;
}

// ---------- montagem ----------
emit(`var PECA = ${J(AQUI)};`);
emit(`var DUR = ${r3(DUR)};`);
emit(LIB);
emit(`app.beginSuppressDialogs();`);
emit(`try {`);
emit(`app.beginUndoGroup("montagem v9");`);
emit(`var LF0 = new File(PECA + "/monta-v9.log"); if (LF0.exists) LF0.remove();`);
// o projeto que ficou pela metade (sem arquivo e com a comp desta montagem) fecha sem salvar; qualquer outro trava
emit(`if (app.project.numItems > 0) { var minha = false; for (var ii = 1; ii <= app.project.numItems; ii++) { if (app.project.item(ii).name == "CINCO-MOTIVOS-BASE") minha = true; } if (minha && (!app.project.file || app.project.file.name == "CINCO-MOTIVOS-v9.aep")) { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); app.newProject(); log("projeto da montagem anterior fechado sem salvar"); } else { throw new Error("o projeto aberto no AE n\\u00e3o est\\u00e1 vazio: salve ou feche antes de montar"); } }`);
emit(`var COMP = app.project.items.addComp("CINCO-MOTIVOS-BASE", 1080, 1920, 1, DUR, ${FPS});`);
emit(`COMP.bgColor = hx("${C.ink}"); COMP.motionBlur = true; COMP.shutterAngle = 240; COMP.shutterPhase = -120;`);
emit(`try { COMP.motionBlurSamplesPerFrame = 16; COMP.motionBlurAdaptiveSampleLimit = 128; } catch (e) { log("amostras: " + e); }`);
emit(`var FONTE6 = "Sora-SemiBold", FONTE7 = "Sora-Bold", FONTE8 = "Sora-ExtraBold", FONTE_ENF = "DMSerifDisplay-Italic", TAM_ENF = 96;`);
emit(`log("comp ok");`);

// ===== fundo (a camada nova entra no topo: o código vai de baixo pra cima) =====
emit(`var FUNDO = COMP.layers.addSolid(hx("${C.ink}"), "Fundo", 1080, 1920, 1, DUR);`);
{
  const L = forma("Luz coral");
  const g1 = grupo(L, "luz alta"); emit(`eli(${g1}, 1100, 1100, 0, 0); fil(${g1}, "${C.coral}", 60);`);
  emit(`tfg(${g1}).property("ADBE Vector Position").expression = "[230 + Math.sin(time*0.31)*140, 520 + Math.cos(time*0.27)*120]";`);
  const g2 = grupo(L, "luz baixa"); emit(`eli(${g2}, 1300, 1300, 0, 0); fil(${g2}, "${C.coral7}", 70);`);
  emit(`tfg(${g2}).property("ADBE Vector Position").expression = "[900 + Math.cos(time*0.23)*160, 1500 + Math.sin(time*0.29)*140]";`);
  emit(`desfoque(${L}, 320); ${L}.blendingMode = BlendingMode.SCREEN;`);
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`var k=[[0,34],[3.3,38],[3.6,60],[5.6,46],[${r3(40.5 + D)},46],[${r3(40.9 + D)},0]];var v=k[k.length-1][1];for(var i=0;i<k.length-1;i++){if(t<=k[i+1][0]){v=lerp(k[i][1],k[i+1][1],cl((t-k[i][0])/(k[i+1][0]-k[i][0])));break;}}if(t<0){v=34;}v`)});`);
}
{
  const L = forma("Grade de pontos", "COMP", 60, 64);
  const g = grupo(L, "ponto"); emit(`eli(${g}, 6, 6, 0, 0); fil(${g}, "${C.creme}", 100);`);
  emit(`try { var rp1 = its(${g}).addProperty("ADBE Vector Filter - Repeater"); rp1.property("ADBE Vector Repeater Copies").setValue(21); rp1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([48, 0]);`);
  emit(`var rp2 = its(${g}).addProperty("ADBE Vector Filter - Repeater"); rp2.property("ADBE Vector Repeater Copies").setValue(40); rp2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 48]); } catch (e) { log("repetidor: " + e); }`);
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`9*pr(t,0,0.4)*(1-pr(t,${r3(40.4 + D)},0.4))`)});`);
  emit(`tl(${L}).property("ADBE Position").expression = "value + [0, -((time*6) % 48)]";`);
}
{
  const L = forma("Particulas");
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
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`100*pr(t,0,0.5)*(1-pr(t,${r3(40.5 + D)},0.4))`)});`);
}
{
  const L = forma("Raios", "COMP", 540, 820);
  const g = grupo(L, "raios");
  for (let k = 0; k < 18; k++) {
    const a0 = ((k * 20 - 3) * Math.PI) / 180, a1 = ((k * 20 + 3) * Math.PI) / 180;
    emit(`poli(${g}, ${J([[0, 0], [1100 * Math.cos(a0), 1100 * Math.sin(a0)], [1100 * Math.cos(a1), 1100 * Math.sin(a1)]])}, true);`);
  }
  emit(`fil(${g}, "${C.coral}", 100); desfoque(${L}, 34); ${L}.blendingMode = BlendingMode.ADD;`);
  emit(`tl(${L}).property("ADBE Rotate Z").expression = "time*9";`);
  const R = J(RAIOS);
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`var R=${R};var m=0;for(var i=0;i<R.length;i++){var r=R[i];if(t>=r-0.08&&t<=r+0.9){var o=t<r+0.06?pr(t,r-0.08,0.14):1-pr(t,r+0.06,0.84);if(o>m){m=o;}}}m*42`)});`);
  emit(`X(tl(${L}).property("ADBE Scale"), ${X(`var R=${R};var s=0.6,m=0;for(var i=0;i<R.length;i++){var r=R[i];if(t>=r-0.08&&t<=r+0.9){var o=t<r+0.06?pr(t,r-0.08,0.14):1-pr(t,r+0.06,0.84);if(o>m){m=o;s=lerp(0.6,1.2,eOut(pr(t,r-0.08,0.98)));}}}[s*100,s*100]`)});`);
  const M = forma("Raios mascara", "COMP", 540, 820);
  const gm = grupo(M, "mascara"); emit(`eli(${gm}, 1240, 1240, 0, 0); fil(${gm}, "#FFFFFF", 100);`);
  emit(`var fm = desfoque(${M}, 560); fm.property("ADBE Gaussian Blur 2-0003").setValue(0);`);
  emit(`filho(${M}, ${L}, 0, 0); ${L}.setTrackMatte(${M}, TrackMatteType.ALPHA); ${M}.enabled = false;`);
}
// a luz coral atrás do celular fica no Remotion (gradiente radial da v8, junto com o celular)
emit(`log("fundo ok");`);

// ===== cena 0: o gancho =====
{
  const t0 = 0.05, t1 = 3.2, tc = S("CPF") - 0.06;
  const ID = [[retV(0, 0, 420, 260, 34), true], [arcoP(-118, -20, 46, 0, 360, 24), true], [arcoP(-118, 88, 76, 200, 340, 12), false], [[[10, -60], [160, -60]], false], [[[10, -10], [130, -10]], false], [[[10, 40], [160, 40]], false]];
  const L = forma("Gancho cartao");
  cartaoForma(L, 820, 600, 44);
  anim(L, "Gancho cartao", { x: 540, y: 830, t0, t1, ent: "zoom", esc0: 0.7, din: 0.3, sai: "cima", flu: { a: 6, r: 0.8, ph: 0 } });
  const I = forma("Gancho documento");
  traco(I, ID, C.creme, 10, "eInOut(pr(t,0.3,0.75))*100");
  emit(`vida(${I}, ${t0}, ${t1});`);
  filha(I, "Gancho cartao", 0, -90);
  const T = txt("Gancho CPF", "CPF", "FONTE8", 190, C.papel, { track: 40 });
  anim(T, "Gancho CPF", { x: 500, y: 1010, t0: tc, t1, ent: "slam", esc0: 1.9, din: 0.22, sai: "cima", flu: { a: 6, r: 0.8, ph: 0 } });
  const Q = txt("Gancho interrogacao", "?", "FONTE_ENF", 230, C.coral, { anc: [0.5, 0.85] });
  anim(Q, "Gancho interrogacao", { x: 762, y: 1010 + 0.35 * 160, t0: S("CPF") + 0.18, t1, ent: "zoom", esc0: 0.2, rot0: -35, din: 0.24, sai: "cima", flu: { a: 6, r: 0, ph: 0 }, rotExtra: "9*Math.sin(2*Math.PI*1.1*t)" });
}
emit(`log("cena 0 ok");`);

// ===== cena 1: "Cinco motivos pra ter CNPJ." =====
{
  const t0 = S("Cinco") - 0.05, t1 = 5.55;
  const A = txt("Abertura 5", "5", "FONTE8", 560, C.coral);
  anim(A, "Abertura 5", { x: 540, y: 760, t0, t1, ent: "slam", esc0: 2.3, rot0: -10, din: 0.24, sai: "cima", flu: { a: 6, r: 1.2, ph: 0.5 } });
  const B = txt("Abertura motivos", "motivos", "FONTE_ENF", 150, C.papel);
  anim(B, "Abertura motivos", { x: 540, y: 1075, t0: S("motivos") - 0.04, t1, ent: "dir", dist: 280, din: 0.24, sai: "cima", flu: { a: 5, r: 0.6, ph: 2.1 } });
  const Cc = txt("Abertura pra ter CNPJ", "pra ter CNPJ", "FONTE7", 66, C.creme);
  anim(Cc, "Abertura pra ter CNPJ", { x: 540, y: 1195, t0: S("pra") - 0.02, t1, ent: "esq", dist: 280, din: 0.24, sai: "cima", op: 0.82, flu: { a: 4, r: 0, ph: 3.2 } });
}
emit(`log("cena 1 ok");`);

// ===== o trilho dos números grandes (pré-composição 500x480 que recorta a janela) =====
{
  emit(`var TRC = app.project.items.addComp("Trilho dos numeros", 500, 480, 1, DUR, ${FPS}); TRC.motionBlur = true; TRC.shutterAngle = 240; TRC.shutterPhase = -120;`);
  emit(`try { TRC.motionBlurSamplesPerFrame = 16; TRC.motionBlurAdaptiveSampleLimit = 128; } catch (e) {}`);
  const slot = `function slotDo(t){var T=${J(TROCAS)};var v=0;for(var i=0;i<T.length;i++){v+=eBack(pr(t,T[i],0.36),0.7);}return v;}`;
  for (const eco of [true, false]) {
    const N = forma(eco ? "Faixa eco" : "Faixa", "TRC");
    if (eco) emit(`X(tl(${N}).property("ADBE Position"), ${X(slot + `[16+7*Math.cos(2*Math.PI*0.32*t),16+7*Math.sin(2*Math.PI*0.32*t)-660*slotDo(t-0.05)]`)});`);
    else emit(`X(tl(${N}).property("ADBE Position"), ${X(slot + `[0,-660*slotDo(t)]`)});`);
    emit(`${N}.motionBlur = true;`);
    for (let i = 1; i <= 5; i++) {
      const T = txt(`${eco ? "Eco" : "Numero"} ${i}`, String(i), "FONTE8", 600, eco ? C.papel : C.coral, { comp: "TRC", track: -40, anc: [0, 0.5] });
      if (eco) emit(`contorno(${T}, "${C.papel}", 3); tl(${T}).property("ADBE Opacity").setValue(34);`);
      else emit(`sombra(${T}, "#000000", 45, 18, 50);`);
      emit(`filho(${T}, ${N}, 11, ${232 + i * 660}); ${T}.motionBlur = true;`);
    }
  }
  emit(`var TRL = COMP.layers.add(TRC); TRL.name = "Trilho"; tl(TRL).property("ADBE Position").setValue([346, 484]); TRL.motionBlur = true;`);
  emit(`X(tl(TRL).property("ADBE Position"), ${X("var q=tremida(t);[346+q[0],484+q[1]]")});`);
  emit(`vida(TRL, ${r3(TROCAS[0])}, ${r3(TROCAS[5] + 0.4)});`);
}
emit(`log("trilho ok");`);

// ===== cena 2: motivo 1 (a régua do ano até o teto, os 12 meses e a conta) =====
{
  const t0 = S("Um") - 0.03, t1 = 10.52 + D;
  const tg = S("MEI") - 0.05, tf = S("fixa") - 0.05;
  const tF = S("Fature") - 0.1, t1r = S("1 real") - 0.06, tT = S("teto") - 0.06, tE = S("exatamente") - 0.08;
  const t67 = S("6.750") - 0.04, f67 = E("6.750"), tPm = S("mês") - 0.2;
  const chega = tT + 0.67, passo = (f67 - t67 - 0.25) / 12, SEG = 780 / 12;
  const base = `var kn=eInOut(pr(t,${r3(tT + 0.12)},0.55));var kx=lerp(190,880,kn);var some=eIn(pr(t,${r3(tE)},0.2));var confirma=t>${r3(chega)}?Math.sin(pr(t,${r3(chega)},0.26)*Math.PI):0;`;
  // a guia de papel (sem valor: F063) e o cadeado, flutuando juntos
  const G = forma("M1 guia");
  {
    const gb = grupo(G, "barras"); for (let i = 0; i < 17; i++) { const w = i % 3 === 0 ? 7 : 4; emit(`ret(${gb}, ${w}, 52, 0, ${r3(-140 + 32 + i * 13 + w / 2)}, ${-185 + 282 + 26}); fil(${gb}, "${C.ink}", 85);`); }
    const gl = grupo(G, "linhas"); [[96, 150], [132, 190], [168, 130], [204, 170]].forEach(([y, w]) => emit(`ret(${gl}, ${w}, 14, 7, ${r3(-140 + 30 + w / 2)}, ${-185 + y + 7}); fil(${gl}, "${C.cinzaPapel}", 100);`));
    const gc = grupo(G, "cabeca"); emit(`ret(${gc}, 220, 30, 10, 0, ${-185 + 30 + 15}); fil(${gc}, "${C.coral}", 100);`);
    const gp = grupo(G, "papel"); emit(`ret(${gp}, 280, 370, 26, 0, 0); fil(${gp}, "${C.papel}", 100);`);
    emit(`sombra(${G}, "#000000", 60, 26, 70);`);
  }
  anim(G, "M1 guia", { x: 770, y: 470, t0: tg, t1, ent: "baixo", dist: 200, rot0: 14, din: 0.3, flu: { a: 7, r: 0, ph: 0.3 }, escExtra: `1+0.03*(t>${r3(chega)}?Math.sin(pr(t,${r3(chega)},0.26)*Math.PI):0)` });
  const K = forma("M1 cadeado");
  traco(K, [[[[-15, -4], [-15, -13], ...arcoP(0, -13, 15, 180, 360, 10).slice(1, -1), [15, -13], [15, -4]], false], [retV(0, 12, 50, 38, 9), true]], C.papel, 8, `eOut(pr(t,${r3(tf + 0.08)},0.26))*100`);
  { const gc = grupo(K, "circulo"); emit(`eli(${gc}, 112, 112, 0, 0); fil(${gc}, "${C.coral}", 100);`); emit(`sombra(${K}, "#000000", 40, 12, 30);`); }
  anim(K, "M1 cadeado", { x: 892, y: 316, t0: tf, t1, ent: "zoom", esc0: 0.15, rot0: -40, din: 0.26, flu: { a: 7, r: 4, ph: 0.3 }, escExtra: `1+0.16*(t>${r3(chega)}?Math.sin(pr(t,${r3(chega)},0.26)*Math.PI):0)` });
  // a mãe da régua: uma camada vazia no centro da caixa (540, 1090), com a entrada e a saída
  const M = forma("M1 regua");
  anim(M, "M1 regua", { x: 540, y: 1090, t0: tF, t1, ent: "esq", dist: 180, din: 0.26 });
  const relx = (x) => x - 540, rely = (y) => y - 1090;
  // trilho cinza, enchimento coral, meses acendendo, cortes, parede, botão
  {
    const L = forma("M1 regua trilho");
    const g = grupo(L, "trilho"); emit(`ret(${g}, 780, 16, 8, 0, 0); fil(${g}, "${C.linha}", 100);`);
    emit(`vida(${L}, ${r3(tF)}, ${r3(t1)});`); filha(L, "M1 regua", relx(540), rely(1018));
  }
  {
    const L = forma("M1 regua cheia");
    const g = grupo(L, "cheia"); const rp = nv("rp"); emit(`var ${rp} = ret(${g}, 10, 16, 8, 0, 0);`);
    emit(`X(${rp}.property("ADBE Vector Rect Size"), ${X(base + "var w=lerp(kx-150,780,some);[Math.max(0.01,w),16]")});`);
    emit(`X(${rp}.property("ADBE Vector Rect Position"), ${X(base + "var w=lerp(kx-150,780,some);[150+w/2-540,0]")});`);
    emit(`fil(${g}, "${C.coral}", 100);`);
    emit(`vida(${L}, ${r3(tF)}, ${r3(t1)});`); filha(L, "M1 regua", 0, rely(1018));
  }
  {
    const L = forma("M1 regua meses");
    for (let k = 0; k < 12; k++) {
      const g = grupo(L, `mes ${k + 1}`);
      const rp = nv("rp");
      emit(`var ${rp} = ret(${g}, ${r3(SEG - 4)}, 16, 6, ${r3(150 + k * SEG + 2 + (SEG - 4) / 2 - 540)}, 0);`);
      const pm = `eBack(pr(t,${r3(tPm)},0.24),1.6)`, pulso = `Math.sin(Math.PI*pr(t,${r3(tPm)},0.3))`;
      const a0 = `(t>=${r3(t67)}?Math.sin(Math.PI*pr(t,${r3(t67 + 0.1 + k * passo)},0.34)):0)`;
      emit(`X(tfg(${g}).property("ADBE Vector Group Opacity"), ${X(`var a=${a0};` + (k === 0 ? `a=Math.max(a,0.9*${pm});` : "") + "cl(a)*100")});`);
      if (k === 0) emit(`X(${rp}.property("ADBE Vector Rect Size"), ${X(`[${r3(SEG - 4)},16+6*${pulso}]`)});`);
      emit(`fil(${g}, "${C.papel}", 100);`);
    }
    emit(`vida(${L}, ${r3(t67)}, ${r3(t1)});`); filha(L, "M1 regua", 0, rely(1018));
  }
  {
    const L = forma("M1 regua cortes");
    for (let k = 0; k < 11; k++) {
      const g = grupo(L, `corte ${k + 1}`);
      emit(`ret(${g}, 4, 34, 2, 0, 0); fil(${g}, "${C.ink}", 85);`);
      emit(`tfg(${g}).property("ADBE Vector Position").setValue([${r3(150 + (k + 1) * SEG - 540)}, 0]);`);
      emit(`X(tfg(${g}).property("ADBE Vector Scale"), ${X(`var a=eBack(pr(t,${r3(tE + 0.08 + k * 0.03)},0.18),2);[100,a*100]`)});`);
    }
    emit(`vida(${L}, ${r3(tE)}, ${r3(t1)});`); filha(L, "M1 regua", 0, rely(1018));
  }
  for (const brilho of [true, false]) {
    const L = forma(brilho ? "M1 parede brilho" : "M1 parede");
    const g = grupo(L, "parede"); emit(`ret(${g}, ${brilho ? 30 : 16}, ${brilho ? 110 : 96}, 8, 0, ${brilho ? -55 : -48}); fil(${g}, "${C.coral}", 100);`);
    emit(`X(tl(${L}).property("ADBE Scale"), ${X(`var p=eBack(pr(t,${r3(tT)},0.3),1.8);[100,p*100]`)});`);
    if (brilho) emit(`desfoque(${L}, 16);`);
    emit(`vida(${L}, ${r3(tT)}, ${r3(t1)});`);
    filha(L, "M1 regua", relx(930), rely(1058), brilho ? `60*(0.55+0.45*Math.max(0,Math.sin(2*Math.PI*1.4*(t-${r3(chega)}))))/100*100` : "100");
  }
  {
    const L = forma("M1 botao");
    const g = grupo(L, "botao"); emit(`eli(${g}, 61, 61, 0, 0); fil(${g}, "${C.coral}", 100); trc(${g}, "${C.papel}", 7, 100);`);
    emit(`sombra(${L}, "#000000", 45, 10, 26);`);
    emit(`vida(${L}, ${r3(tF)}, ${r3(tE + 0.21)});`); filha(L, "M1 regua", 0, rely(1018));
    emit(`X(tl(${L}).property("ADBE Position"), ${X(base + `[kx-540,${rely(1018)}]`)});`);
    emit(`X(tl(${L}).property("ADBE Scale"), ${X(base + "[(1-some)*100,(1-some)*100]")});`);
  }
  {
    const T = txt("M1 valor", "R$ 1", "FONTE8", 64, C.papel);
    emit(`vida(${T}, ${r3(t1r)}, ${r3(t1)});`);
    emit(`X(${T}.property("ADBE Text Properties").property("ADBE Text Document"), ${X(base + "var v=kn>=1?81000:1+80999*kn*kn;'R$ '+br(v)")});`);
    filha(T, "M1 regua", 0, 0);
    emit(`X(tl(${T}).property("ADBE Anchor Point"), ${X(base + "var r=sourceRectAtTime(time,false);var fr=cl((kx-600)/280);[r.left+r.width*(0.5+0.5*fr),r.top+r.height]")});`);
    emit(`X(tl(${T}).property("ADBE Position"), ${X(base + `[kx-540,${rely(958)}]`)});`);
    emit(`X(tl(${T}).property("ADBE Scale"), ${X(base + `var s=1+0.12*Math.sin(Math.PI*pr(t,${r3(t1r)},0.2))+0.1*Math.sin(Math.PI*pr(t,${r3(chega)},0.24));[s*100,s*100]`)});`);
  }
  {
    const T = txt("M1 faturamento", "faturamento por ano", "FONTE6", 40, C.cinza, { anc: [0, 0] });
    emit(`vida(${T}, ${r3(tF)}, ${r3(t1)});`); filha(T, "M1 regua", relx(150), rely(1062));
    const T2 = txt("M1 teto", "teto", "FONTE8", 44, C.coral, { anc: [1, 0] });
    emit(`vida(${T2}, ${r3(tT)}, ${r3(t1)});`); filha(T2, "M1 regua", relx(938), rely(1062), `100*pr(t,${r3(tT)},0.08)`);
  }
  {
    const T = txt("M1 conta 1", "R$ 81.000 ÷ 12", "FONTE7", 52, C.creme, { anc: [0, 0.5] });
    emit(`vida(${T}, ${r3(tE)}, ${r3(t1)});`); filha(T, "M1 regua", relx(150), rely(1156), `100*pr(t,${r3(tE)},0.06)`);
    emit(`X(tl(${T}).property("ADBE Scale"), ${X(`var s=lerp(0.85,1,eBack(pr(t,${r3(tE)},0.24),1.6));[s*100,s*100]`)});`);
    const T2 = txt("M1 conta igual", "=", "FONTE7", 56, C.creme, { anc: [0, 0.5] });
    emit(`vida(${T2}, ${r3(t67)}, ${r3(t1)});`); filha(T2, "M1 regua", relx(150), rely(1230), `100*pr(t,${r3(t67)},0.05)`);
    const T3 = txt("M1 conta valor", "R$ 6.750", "FONTE8", 64, C.coral, { anc: [0, 0.5] });
    emit(`vida(${T3}, ${r3(t67)}, ${r3(t1)});`); filha(T3, "M1 regua", relx(200), rely(1228), `100*pr(t,${r3(t67)},0.05)`);
    emit(`X(tl(${T3}).property("ADBE Scale"), ${X(`var s=lerp(1.7,1,eBack(pr(t,${r3(t67)},0.22),1.6))*(1+0.06*Math.sin(Math.PI*pr(t,${r3(tPm)},0.3)));[s*100,s*100]`)});`);
    const T4 = txt("M1 conta mes", "por mês", "FONTE7", 52, C.creme, { anc: [0, 0.5] });
    emit(`vida(${T4}, ${r3(tPm)}, ${r3(t1)});`); filha(T4, "M1 regua", relx(545), rely(1230), `100*pr(t,${r3(tPm)},0.06)`);
    emit(`X(tl(${T4}).property("ADBE Scale"), ${X(`var s=lerp(0.6,1,eBack(pr(t,${r3(tPm)},0.24),1.6));[s*100,s*100]`)});`);
  }
}
emit(`log("cena 2 ok");`);

// ===== cena 3: motivo 2 =====
{
  const t0 = S("Dois") - 0.03, t1 = S("Três") - 0.1;
  const tm = S("Dois") + 0.35, t6 = S("6%") - 0.08, tb = S("10") - 0.06, t600 = S("600") - 0.1, t94 = S("9.400") - 0.1;
  const BW = 800, FW = BW * 0.06;
  const MALETA = [[retV(0, 20, 300, 200, 30), true], [[[-55, -80], [-55, -105], ...arcoP(-35, -105, 20, 180, 270, 6).slice(1), [35, -125], ...arcoP(35, -105, 20, 270, 360, 6).slice(1), [55, -80]], false], [[[-150, 20], [150, 20]], false]];
  const Mb = forma("M2 maleta");
  traco(Mb, MALETA, C.creme, 12, `eInOut(pr(t,${r3(tm)},0.45))*100`);
  anim(Mb, "M2 maleta", { x: 770, y: 470, t0: tm, t1, ent: "zoom", esc0: 0.55, din: 0.26, flu: { a: 7, r: 2, ph: 0.9 } });
  const P6 = txt("M2 6 por cento", "6%", "FONTE8", 260, C.coral);
  emit(`X(${P6}.property("ADBE Text Properties").property("ADBE Text Document"), ${X(`Math.round(lerp(0,6,pr(t,${r3(t6)},0.36)))+'%'`)});`);
  ancoraViva(P6, 0.5, 0.5);
  anim(P6, "M2 6 por cento", { x: 540, y: 850, t0: t6, t1, ent: "slam", esc0: 1.9, din: 0.22, flu: { a: 5, r: 1, ph: 2.2 } });
  // a barra dos 10 mil: trilho, enchimento (que perde os 6% da fatia) e o brilho que corre
  const Bm = forma("M2 barra");
  {
    const g2 = grupo(Bm, "brilho");
    const cheio = `var c=${BW}*eOut(pr(t,${r3(tb)},0.4))*(1-0.06*pr(t,${r3(t600)},0.06));`;
    const band = `var x=lerp(-220,${BW + 40},eInOut(pr(t,${r3(tb + 0.42)},0.62)));`;
    for (const [w, op] of [[130, 60]]) {
      const rb = nv("rb");
      emit(`var ${rb} = ret(${g2}, ${w}, 104, 0, 0, 0);`);
      emit(`X(${rb}.property("ADBE Vector Rect Position"), ${X(cheio + band + `[x-${BW / 2},0]`)});`);
      const mg = nv("mg");
      emit(`var ${mg} = ret(${g2}, 10, 104, 52, 0, 0);`);
      emit(`X(${mg}.property("ADBE Vector Rect Size"), ${X(cheio + "[Math.max(0.01,c),104]")});`);
      emit(`X(${mg}.property("ADBE Vector Rect Position"), ${X(cheio + `[c/2-${BW / 2},0]`)});`);
      emit(`try { var mp = its(${g2}).addProperty("ADBE Vector Filter - Merge"); mp.property("ADBE Vector Merge Type").setValue(4); } catch (e) { log("merge: " + e); }`);
      emit(`fil(${g2}, "#FFFFFF", ${op});`);
    }
    emit(`X(tfg(${g2}).property("ADBE Vector Group Opacity"), ${X(`(t>=${r3(tb + 0.42)}&&t<=${r3(tb + 1.1)})?100:0`)});`);
    const g1 = grupo(Bm, "cheio");
    const rc = nv("rc");
    emit(`var ${rc} = ret(${g1}, 10, 104, 52, 0, 0);`);
    emit(`X(${rc}.property("ADBE Vector Rect Size"), ${X(`var c=${BW}*eOut(pr(t,${r3(tb)},0.4))*(1-0.06*pr(t,${r3(t600)},0.06));[Math.max(0.01,c),104]`)});`);
    emit(`X(${rc}.property("ADBE Vector Rect Position"), ${X(`var c=${BW}*eOut(pr(t,${r3(tb)},0.4))*(1-0.06*pr(t,${r3(t600)},0.06));[c/2-${BW / 2},0]`)});`);
    emit(`fil(${g1}, "${C.creme}", 100);`);
    const g0 = grupo(Bm, "trilho"); emit(`ret(${g0}, ${BW}, 104, 52, 0, 0); fil(${g0}, "${C.ink3}", 100); trc(${g0}, "${C.linha}", 2, 100);`);
  }
  anim(Bm, "M2 barra", { x: 540, y: 1085, t0: tb - 0.1, t1, ent: "dir", dist: 200, din: 0.26 });
  {
    const T = txt("M2 dez mil", "R$ 10.000", "FONTE8", 50, C.ink, { anc: [0, 0.5] });
    emit(`vida(${T}, ${r3(tb + 0.3)}, ${r3(t1)});`); filha(T, "M2 barra", -BW / 2 + 44, 0);
    emit(`X(tl(${T}).property("ADBE Scale"), ${X(`var s=lerp(0.6,1,eBack(pr(t,${r3(tb + 0.3)},0.2)));[s*100,s*100]`)});`);
  }
  {
    const L = forma("M2 fatia");
    const g = grupo(L, "fatia"); emit(`ret(${g}, ${r3(FW + 12)}, 104, 20, 0, 0); fil(${g}, "${C.coral}", 100);`);
    emit(`sombra(${L}, "#000000", 45, 14, 34);`);
    const fa = `var fa=eBack(pr(t,${r3(t600 + 0.04)},0.38),1.6);var sb=pr(t,${r3(t1 - 0.16)},0.16);var fl=Math.sin(2*Math.PI*0.42*t+1.1);`;
    emit(`X(tl(${L}).property("ADBE Position"), ${X(fa + `var q=tremida(t);[lerp(${r3(540 + BW / 2 - FW / 2 - 6)},880,fa)-240*eIn(sb)+q[0],lerp(1085,1228,fa)+5*fa*fl+q[1]]`)});`);
    emit(`X(tl(${L}).property("ADBE Rotate Z"), ${X(fa + "-12*fa+3*fa*fl")});`);
    emit(`X(tl(${L}).property("ADBE Opacity"), ${X(fa + "(1-cl((sb-0.55)/0.45))*100")});`);
    emit(`vida(${L}, ${r3(t600)}, ${r3(t1)}); ${L}.motionBlur = true;`);
  }
  {
    const T = txt("M2 seiscentos", "R$ 600", "FONTE8", 70, C.coral);
    emit(`X(${T}.property("ADBE Text Properties").property("ADBE Text Document"), ${X(`'R$ '+br(lerp(0,600,eOut(pr(t,${r3(t600 + 0.25)},0.45))))`)});`);
    ancoraViva(T, 0.5, 0.5);
    anim(T, "M2 seiscentos", { x: 820, y: 1338, t0: t600 + 0.25, t1, ent: "slam", esc0: 1.7, din: 0.22, flu: { a: 5, r: 0, ph: 1.1 }, escExtra: `1+0.08*Math.sin(Math.PI*pr(t,${r3(t600 + 0.7)},0.22))` });
    const T2 = txt("M2 nove mil", "R$ 9.400", "FONTE8", 92, C.papel, { just: "LEFT_JUSTIFY" });
    emit(`X(${T2}.property("ADBE Text Properties").property("ADBE Text Document"), ${X(`'R$ '+br(lerp(0,9400,eOut(pr(t,${r3(t94)},0.55))))`)});`);
    emit(`X(tl(${T2}).property("ADBE Anchor Point"), ${J("var r=sourceRectAtTime(time,false);[r.left+230,r.top+r.height/2]")});`);
    anim(T2, "M2 nove mil", { x: 360, y: 1232, t0: t94, t1, ent: "slam", esc0: 1.7, din: 0.24, flu: { a: 5, r: 0, ph: 4 }, escExtra: `1+0.07*Math.sin(Math.PI*pr(t,${r3(t94 + 0.55)},0.22))` });
  }
  simboloPop("M2 visto do bolso", 624, 1232, 84, S("bolso") - 0.05, t1, { flu: { a: 5, r: 0, ph: 4 } });
}
emit(`log("cena 3 ok");`);

// ===== cena 4: motivo 3 =====
{
  const t0 = S("Três") - 0.03, t1 = 25.18 + D;
  const tp = S("microempresa", 2) - 0.1, ts = S("salário") - 0.1, ti = S("INSS") - 0.06;
  const CX = 540, CY = 1062, CW = 780, CH = 500, COL = 12, LIN = 8, PX = 50, x0 = CX - 20 - ((COL - 1) * PX) / 2, y0 = CY + 192;
  const ALT = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8];
  const tA = S("recolhe") - 0.05, tZ = S("aposentadoria") + 0.25;
  const NOTA = [[retV(0, 0, 300, 170, 24), true], [arcoP(0, 0, 42, 0, 360, 24), true], [[[-118, 0], [-100, 0]], false], [[[100, 0], [118, 0]], false]];
  const Nt = forma("M3 nota");
  traco(Nt, NOTA, C.creme, 11, `eInOut(pr(t,${r3(ts)},0.42))*100`);
  anim(Nt, "M3 nota", { x: 770, y: 400, t0: ts, t1, ent: "zoom", esc0: 0.55, din: 0.26, flu: { a: 6, r: 1.5, ph: 0.4 } });
  const Pi = forma("M3 INSS");
  { const g = grupo(Pi, "pilula"); emit(`ret(${g}, 300, 116, 58, 0, 0); fil(${g}, "${C.coral}", 100);`); emit(`sombra(${Pi}, "#000000", 40, 14, 34);`); }
  anim(Pi, "M3 INSS", { x: 770, y: 590, t0: ti, t1, ent: "zoom", esc0: 0.2, rot0: -10, din: 0.24, flu: { a: 5, r: 2, ph: 0.4 } });
  { const T = txt("M3 INSS texto", "INSS", "FONTE8", 66, C.papel); emit(`vida(${T}, ${r3(ti)}, ${r3(t1)});`); filha(T, "M3 INSS", 0, 2); }
  const Cd = forma("M3 painel");
  cartaoForma(Cd, CW, CH, 40);
  anim(Cd, "M3 painel", { x: CX, y: CY, t0: tp, t1, ent: "baixo", dist: 200, din: 0.28 });
  {
    const L = forma("M3 pontos apagados");
    const g = grupo(L, "pontos");
    for (let c = 0; c < COL; c++) for (let l = 0; l < LIN; l++) emit(`eli(${g}, 18, 18, ${r3(x0 + c * PX - CX)}, ${r3(y0 - l * PX - CY)});`);
    emit(`fil(${g}, "${C.creme}", 100);`);
    emit(`vida(${L}, ${r3(tp)}, ${r3(t1)});`); filha(L, "M3 painel", 0, 0, `16*pr(t,${r3(tp + 0.15)},0.1)`);
  }
  for (const brilho of [true, false]) {
    const L = forma(brilho ? "M3 pontos brilho" : "M3 pontos acesos");
    for (let c = 0; c < COL; c++) for (let l = 0; l < ALT[c]; l++) {
      const g = grupo(L, `p ${c}-${l}`);
      const cor = c >= COL - 2 ? C.papel : C.coral;
      emit(`eli(${g}, ${brilho ? 26 : 20}, ${brilho ? 26 : 20}, 0, 0); fil(${g}, "${cor}", 100);`);
      emit(`tfg(${g}).property("ADBE Vector Position").setValue([${r3(x0 + c * PX - CX)}, ${r3(y0 - l * PX - CY)}]);`);
      const tc = tA + ((tZ - tA) * c) / (COL - 1) + l * 0.03;
      emit(`X(tfg(${g}).property("ADBE Vector Scale"), ${X(`var ka=eBack(pr(t,${r3(tc)},0.14),2.2);var s=ka*(1+0.14*pr(t,${r3(tc + 0.2)},0.3)*Math.sin(2*Math.PI*1.3*t-${r3(c * 0.55)}-${r3(l * 0.35)}));[s*100,s*100]`)});`);
    }
    if (brilho) emit(`desfoque(${L}, 9);`);
    emit(`vida(${L}, ${r3(tA)}, ${r3(t1)});`); filha(L, "M3 painel", 0, 0, brilho ? "70" : "100");
  }
  simboloPop("M3 visto", 868, 862, 64, S("aposentadoria") + 0.1, t1);
}
emit(`log("cena 4 ok");`);

// ===== cena 5: motivo 4 (o celular entra no Remotion) =====
{
  const t0 = S("Quatro") - 0.03, t1 = 30.0 + D, X0 = 290;
  const CALC = [[retV(0, 0, 86, 108, 14), true], [retV(0, -27, 58, 24, 6), true], ...[[-23, 12], [0, 12], [23, 12], [-23, 35], [0, 35], [23, 35]].map(([x, y]) => [[[x, y], [x, y + 0.1]], false])];
  const NOTA_F = [[retV(0, 0, 80, 104, 13), true], [[[-22, -24], [22, -24]], false], [[[-22, 0], [22, 0]], false], [[[-22, 24], [9, 24]], false]];
  const BARRAS = [-38, -24, -13, 4, 16, 27, 40].map((x) => [[[x, -36], [x, 36]], false]);
  const flu = { a: 5, r: 0, ph: 0.6 };
  const card = (n, y, tt, partes, leitor) => {
    const L = forma(`M4 cartao ${n}`);
    cartaoForma(L, 180, 180, 38);
    anim(L, `M4 cartao ${n}`, { x: X0, y, t0: tt, t1, ent: "esq", dist: 220, din: 0.26, flu });
    const I = forma(`M4 icone ${n}`);
    traco(I, partes, C.creme, 8, `eInOut(pr(t,${r3(tt + 0.1)},0.36))*100`);
    emit(`vida(${I}, ${r3(tt)}, ${r3(t1)});`); filha(I, `M4 cartao ${n}`, 0, -6);
    if (leitor) {
      const Ld = forma(`M4 leitor ${n}`);
      const g = grupo(Ld, "linha"); emit(`ret(${g}, 4, 92, 2, 0, 0); fil(${g}, "${C.coral}", 100);`);
      emit(`sombra(${Ld}, "${C.coral}", 90, 0, 14);`);
      emit(`vida(${Ld}, ${r3(tt + 0.5)}, ${r3(t1)});`); filha(Ld, `M4 cartao ${n}`, 0, -6, `100*pr(t,${r3(tt + 0.5)},0.1)`);
      emit(`X(tl(${Ld}).property("ADBE Position"), ${X(`[46*Math.sin(2*Math.PI*0.9*(t-${r3(tt + 0.5)})-Math.PI/2),-6]`)});`);
    }
    simboloPop(`M4 visto ${n}`, X0 + 58, y + 58, 46, tt + 0.4, t1, { flu });
  };
  card(1, 850, S("calcula") - 0.1, CALC, false);
  card(2, 1046, S("nota") - 0.12, NOTA_F, false);
  card(3, 1242, S("paga") - 0.12, BARRAS, true);
}
emit(`log("cena 5 ok");`);

// ===== cena 6: motivo 5 =====
{
  const t0 = S("Cinco", 2) - 0.03, t1 = 33.42 + D, ta = S("abertura") - 0.1, tg = S("gente") - 0.06;
  const CONTRATO = [[retV(0, 0, 250, 320, 24), true], [[[-80, -100], [80, -100]], false], [[[-80, -50], [80, -50]], false], [[[-80, 0], [40, 0]], false], [[[-80, 110], [-10, 110]], false]];
  const Ct = forma("M5 contrato");
  traco(Ct, CONTRATO, C.creme, 9, `eInOut(pr(t,${r3(ta)},0.5))*100`);
  anim(Ct, "M5 contrato", { x: 290, y: 1010, t0: ta, t1, ent: "zoom", esc0: 0.6, din: 0.26, flu: { a: 6, r: 0, ph: 2.5 } });
  {
    const L = forma("M5 onda", "COMP", 290, 1045);
    const g = grupo(L, "anel"); emit(`eli(${g}, 192, 192, 0, 0); trc(${g}, "${C.coral}", 8, 100);`);
    const on = `var on=pr(t,${r3(tg + 0.14)},0.66);`;
    emit(`X(tl(${L}).property("ADBE Scale"), ${X(on + "var s=lerp(0.8,1.6,eOut(on));[s*100,s*100]")});`);
    emit(`X(tl(${L}).property("ADBE Opacity"), ${X(on + "(1-on)*100")});`);
    emit(`vida(${L}, ${r3(tg + 0.14)}, ${r3(tg + 0.8)}); ${L}.motionBlur = true;`);
  }
  const Sb = forma("M5 carimbo");
  simboloForma(Sb, 150);
  emit(`sombra(${Sb}, "#000000", 45, 14, 26);`);
  anim(Sb, "M5 carimbo", { x: 290, y: 1045, t0: tg, t1, ent: "slam", esc0: 2.6, din: 0.18, flu: { a: 6, r: 0, ph: 2.5 } });
}
emit(`log("cena 6 ok");`);

// ===== cena 7: o chamado =====
{
  const t0 = S("Se") - 0.05, t1 = 40.5 + D, tbur = S("burocracia"), tc = S("clique") - 0.1, X0 = 290, Y = 820, te = S("lista") - 0.1, LY = 1110;
  const toques = [S("clique"), S("bio")];
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const ti = t0 + 0.1 + i * 0.28, y = 1040 - i * 26, rz = [-6, 4, -3, 7, -5, 3][i];
    const L = forma(`Burocracia folha ${i + 1}`);
    const gl = grupo(L, "linhas"); [-40, -10, 20].forEach((yy) => emit(`ret(${gl}, 150, 10, 5, -10, ${yy}); fil(${gl}, "${C.cinzaPapel}", 100);`));
    const gp = grupo(L, "papel"); emit(`ret(${gp}, 228, 148, 14, 0, 0); fil(${gp}, "${C.papel}", 100); trc(${gp}, "${C.cinzaPapel}", 2, 100);`);
    emit(`sombra(${L}, "#000000", 45, 8, 20);`);
    const f = `var cai=eOut(pr(t,${r3(ti)},0.26));var voa=eIn(pr(t,${r3(tbur + 0.05 + i * 0.04)},0.6));`;
    emit(`X(tl(${L}).property("ADBE Position"), ${X(f + `var q=tremida(t);[lerp(${X0 + (i % 2 ? 40 : -40)},${X0},cai)+(${-260 - X0})*voa+q[0],lerp(${y - 420},${y},cai)+(${-360 - i * 60})*voa+q[1]]`)});`);
    emit(`X(tl(${L}).property("ADBE Rotate Z"), ${X(f + `var tr=(t>${r3(tbur - 0.45)}&&t<${r3(tbur + 0.05)})?Math.sin(t*70+${i})*3:0;lerp(${rz * 3},${rz},cai)-70*voa+tr`)});`);
    emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`100*pr(t,${r3(ti)},0.06)`)});`);
    emit(`vida(${L}, ${r3(ti)}, ${r3(tbur + 1.0)}); ${L}.motionBlur = true;`);
  });
  const aperta = `var ap=0;var TQ=${J(toques)};for(var i=0;i<TQ.length;i++){if(t>=TQ[i]&&t<TQ[i]+0.22){ap=Math.max(ap,Math.sin(pr(t,TQ[i],0.22)*Math.PI));}}`;
  const Pl = forma("Chamado pilula");
  { const g = grupo(Pl, "pilula"); emit(`ret(${g}, 330, 104, 52, 0, 0); fil(${g}, "${C.coral6}", 100);`); emit(`sombra(${Pl}, "#000000", 40, 14, 34);`); }
  anim(Pl, "Chamado pilula", { x: X0, y: Y, t0: tc, t1, ent: "zoom", esc0: 0.3, din: 0.24, sai: "nada", escExtra: `(function(){${aperta}return (1-0.08*ap)*(1+0.035*pr(t,${r3(tc + 0.3)},0.2)*Math.sin(2*Math.PI*1.2*t));})()` });
  { const T = txt("Chamado LINK DA BIO", "LINK DA BIO", "FONTE8", 36, C.papel, { track: 30 }); emit(`vida(${T}, ${r3(tc)}, ${r3(t1)});`); filha(T, "Chamado pilula", 0, 2); }
  toques.forEach((tt, k) => {
    const L = forma(`Chamado toque ${k + 1}`);
    const g = grupo(L, "toque"); emit(`eli(${g}, 60, 60, 0, 0); fil(${g}, "${C.papel}", 100);`);
    emit(`vida(${L}, ${r3(tt)}, ${r3(tt + 0.55)});`); filha(L, "Chamado pilula", 90, 14, `55*(1-pr(t,${r3(tt)},0.5))`);
    emit(`X(tl(${L}).property("ADBE Scale"), ${X(`var s=lerp(0.4,2.6,eOut(pr(t,${r3(tt)},0.5)));[s*100,s*100]`)});`);
  });
  const Ls = forma("Chamado lista");
  // as linhas antes do cartão: no AE o grupo criado primeiro fica na frente
  { const g = grupo(Ls, "linhas"); [[55, 150], [125, 190], [195, 120]].forEach(([y, w]) => emit(`ret(${g}, ${w}, 18, 9, ${r3(-165 + 103 + w / 2)}, ${r3(-125 + y)}); fil(${g}, "${C.cinza}", 70);`)); }
  cartaoForma(Ls, 330, 250, 34);
  anim(Ls, "Chamado lista", { x: X0, y: LY, t0: te, t1, ent: "baixo", dist: 160, din: 0.26, sai: "nada", flu: { a: 5, r: 0, ph: 3.3 } });
  simboloPop("Chamado visto", X0 - 115, LY - 70, 58, S("espera") - 0.05, t1, { sai: "nada", flu: { a: 5, r: 0, ph: 3.3 } });
}
emit(`log("cena 7 ok");`);

// ===== a legenda em blocos: entra subindo, cada palavra pula quando é dita, sai subindo =====
let nb = 0;
for (const b of BLOCOS) {
  // no AE o espaço não separável vira espaço comum: "1 real" e "81 mil" contam como duas palavras, com o mesmo tempo
  const pals = [];
  b.ws.forEach((w, j) => w.split(/[\s ]+/).forEach((p) => pals.push({ p, s: WORDS[b.idx[j]].s, enf: j === b.ik })));
  const tx = pals.map((q) => q.p).join(" ");
  const L = nv("LG");
  emit(`var ${L} = texto(COMP, ${J(nome(`Legenda ${++nb}`))}, ${J(tx)}, FONTE7, 72, "${C.papel}", ParagraphJustification.CENTER_JUSTIFY, -25);`);
  { const sp = []; let pos = 0; pals.forEach((q, i) => { pos += q.p.length; if (i < pals.length - 1) { sp.push(pos); pos += 1; } }); if (sp.length) emit(`respiro(${L}, ${J(sp)}, 70);`); }
  const iEnf = pals.findIndex((q) => q.enf);
  if (iEnf >= 0) {
    const c0 = pals.slice(0, iEnf).reduce((s, q) => s + q.p.length + 1, 0);
    let c1 = c0;
    for (let i = iEnf; i < pals.length && pals[i].enf; i++) c1 += pals[i].p.length + (i + 1 < pals.length && pals[i + 1].enf ? 1 : 0);
    const e0 = iEnf > 0 ? 1 : 0;
    const iUlt = pals.length - 1 - [...pals].reverse().findIndex((q) => q.enf);
    const e1 = iUlt < pals.length - 1 ? 1 : 0;
    emit(`enfase(${L}, ${c0 - e0}, ${c1 + e1}, ${e0}, ${e1});`);
  }
  emit(`legPos(${L}, ${Y_LEG}, ${LARG_LEG});`);
  emit(`sombra(${L}, "#000000", 70, 6, 24);`);
  emit(`vida(${L}, ${r3(b.tin)}, ${r3(b.fim - 0.02)}); ${L}.motionBlur = true;`);
  const mov = `var a=pr(t,${r3(b.tin)},0.2),ea=eBack(a,1.7);var sai=pr(t,${r3(b.fim - 0.08)},0.08);`;
  emit(`X(tl(${L}).property("ADBE Position"), ${X(mov + "[value[0],value[1]+56*(1-ea)-34*eIn(sai)]")});`);
  emit(`X(tl(${L}).property("ADBE Scale"), ${X(mov + "var s=lerp(0.9,1,ea);[value[0]*s,value[1]*s]")});`);
  emit(`X(tl(${L}).property("ADBE Opacity"), ${X(mov + "cl(a/0.18)*(1-sai)*100")});`);
  const cs = [], ce = [];
  pals.forEach((q, i) => { for (const _ of q.p) { cs.push(q.s); ce.push(q.enf ? 1 : 0); } if (i < pals.length - 1) { cs.push(q.s); ce.push(q.enf && pals[i + 1].enf ? 1 : 0); } });
  const SS = J(cs), EN = J(ce);
  emit(`var anims = ${L}.property("ADBE Text Properties").property("ADBE Text Animators");`);
  if (iEnf >= 0) {
    emit(`var avK = anims.addProperty("ADBE Text Animator"); avK.name = "chave"; cor4(avK.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color"), "${C.coral}");`);
    emit(`var sK = avK.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector"); `);
    emit(`X(sK.property("ADBE Text Expressible Amount"), ${J(`var E=${EN};E[textIndex-1]?100:0`)});`);
  }
  emit(`var avD = anims.addProperty("ADBE Text Animator"); avD.name = "apagado"; avD.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(32);`);
  emit(`var sD = avD.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector"); `);
  emit(`X(sD.property("ADBE Text Expressible Amount"), ${J(XL + `var S=${SS};var s=S[textIndex-1];100*(1-pr(time,s-0.06,0.05))`)});`);
  emit(`var avP = anims.addProperty("ADBE Text Animator"); avP.name = "pulo"; avP.property("ADBE Text Animator Properties").addProperty("ADBE Text Scale 3D").setValue([105, 105, 100]); avP.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, -9, 0]);`);
  emit(`var sP = avP.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector"); `);
  emit(`X(sP.property("ADBE Text Expressible Amount"), ${J(XL + `var S=${SS};100*salto(time,S[textIndex-1]-0.06)`)});`);
  if (iEnf >= 0) {
    emit(`var avE = anims.addProperty("ADBE Text Animator"); avE.name = "pulo da enfase"; avE.property("ADBE Text Animator Properties").addProperty("ADBE Text Scale 3D").setValue([103, 103, 100]); avE.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, -5, 0]); avE.property("ADBE Text Animator Properties").addProperty("ADBE Text Rotation").setValue(-3);`);
    emit(`var sE = avE.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector"); `);
    emit(`X(sE.property("ADBE Text Expressible Amount"), ${J(XL + `var S=${SS};var E=${EN};E[textIndex-1]?100*salto(time,S[textIndex-1]-0.06):0`)});`);
  }
}
emit(`log("legendas ok: ${nb} blocos");`);

// ===== cena 8: o fecho do kit ("Vai," + logo, o "aí" acende, LINK DA BIO) no papel =====
{
  const tc = 40.45 + D, FV = 40.9 + D, ta = FV - 0.04, tl0 = FV + 1.25;
  {
    const L = forma("Fecho papel", "COMP", 540, 900);
    const g = grupo(L, "papel"); const e = nv("e"); emit(`var ${e} = eli(${g}, 10, 10, 0, 0);`);
    emit(`X(${e}.property("ADBE Vector Ellipse Size"), ${X(`var d=Math.max(0.01,3000*eInOut(pr(t,${r3(tc)},0.5)));[d,d]`)});`);
    emit(`fil(${g}, "${C.papel}", 100);`);
    emit(`vida(${L}, ${r3(tc)}, DUR);`);
    const A = forma("Fecho anel", "COMP", 540, 900);
    const ga = grupo(A, "anel"); const ea = nv("e"); emit(`var ${ea} = eli(${ga}, 10, 10, 0, 0);`);
    emit(`X(${ea}.property("ADBE Vector Ellipse Size"), ${X(`var d=3000*eInOut(pr(t,${r3(tc)},0.5))+28;[d,d]`)});`);
    emit(`trc(${ga}, "${C.coral}", 6, 100);`);
    emit(`X(tl(${A}).property("ADBE Opacity"), ${X(`var d=3000*eInOut(pr(t,${r3(tc)},0.5));d>4?(1-pr(t,${r3(tc + 0.32)},0.18))*100:0`)});`);
    emit(`vida(${A}, ${r3(tc)}, ${r3(tc + 0.55)});`);
  }
  const G = forma("Fecho assinatura", "COMP", 540, 822);
  emit(`X(tl(${G}).property("ADBE Scale"), ${X(`var s=0.86+0.14*eBack(pr(t,${r3(ta)},0.3),1.3);[s*100,s*100]`)});`);
  emit(`X(tl(${G}).property("ADBE Opacity"), ${X(`100*pr(t,${r3(ta)},0.08)`)});`);
  emit(`vida(${G}, ${r3(ta)}, DUR); ${G}.motionBlur = true;`);
  VAR["Fecho assinatura"] = G;
  const V = txt("Fecho Vai", "Vai,", "FONTE8", 106, C.inkF, { track: -35, anc: [0, 0.5] });
  emit(`var wVai = ${V}.sourceRectAtTime(0, false).width; var x0F = -(wVai + 28 + 590) / 2;`);
  emit(`vida(${V}, ${r3(ta)}, DUR); filho(${V}, ${G}, x0F, 6); ${V}.motionBlur = true;`);
  emit(`X(tl(${V}).property("ADBE Opacity"), ${J(`thisComp.layer("Fecho assinatura").transform.opacity`)});`);
  const ai = `pr(t,${r3(FV + 0.94)},0.12)`;
  {
    const L = forma("Fecho brilho do ai");
    const g = grupo(L, "brilho"); emit(`eli(${g}, 120, 112, 0, 0); fil(${g}, "${C.coral}", 100);`);
    emit(`desfoque(${L}, 46); vida(${L}, ${r3(ta)}, DUR); filho(${L}, ${G}, x0F + wVai + 28 + 590 - 75, 0);`);
    emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`var ai=${ai};(Math.max(0,Math.sin(Math.PI*Math.min(1,ai*1.6)))*0.9+ai*0.15)*38*thisComp.layer("Fecho assinatura").transform.opacity/100`)});`);
  }
  for (const [n, arq, opx] of [["Fecho logo tinta", "logo-ai-tinta.png", null], ["Fecho logo coral", "logo-horizontal.png", ai]]) {
    const L = nv("IM");
    emit(`var ${L} = COMP.layers.add(importa(PECA + "/assets/ae/${arq}")); ${L}.name = ${J(nome(n))};`);
    emit(`tl(${L}).property("ADBE Scale").setValue([${r3((100 * 590) / 1320)}, ${r3((100 * 590) / 1320)}, 100]); vida(${L}, ${r3(ta)}, DUR);`);
    emit(`filho(${L}, ${G}, x0F + wVai + 28 + 295, 0); ${L}.motionBlur = true;`);
    emit(`X(tl(${L}).property("ADBE Opacity"), ${X(`${opx ? opx + "*" : ""}thisComp.layer("Fecho assinatura").transform.opacity`)});`);
  }
  const Pk = forma("Fecho pilula", "COMP", 540, 995);
  { const g = grupo(Pk, "pilula"); emit(`ret(${g}, 330, 70, 35, 0, 0); fil(${g}, "${C.coral}", 100);`); emit(`sombra(${Pk}, "${C.coral6}", 28, 10, 26);`); }
  emit(`X(tl(${Pk}).property("ADBE Scale"), ${X(`var s=(0.7+0.3*eBack(pr(t,${r3(tl0)},0.28),1.6))*(1+0.035*pr(t,${r3(tl0 + 0.3)},0.2)*Math.sin(2*Math.PI*1.2*(t-${r3(tl0 + 0.3)})));[s*100,s*100]`)});`);
  emit(`X(tl(${Pk}).property("ADBE Opacity"), ${X(`100*pr(t,${r3(tl0)},0.08)`)});`);
  emit(`vida(${Pk}, ${r3(tl0)}, DUR); ${Pk}.motionBlur = true;`);
  VAR["Fecho pilula"] = Pk;
  { const T = txt("Fecho LINK DA BIO", "LINK DA BIO", "FONTE8", 34, "#FFFFFF", { track: 60 }); emit(`vida(${T}, ${r3(tl0)}, DUR);`); filha(T, "Fecho pilula", 0, 2); }
}
emit(`log("fecho ok");`);

// ===== conferência das expressões: avalia cada uma e registra as que dão erro =====
emit(`confere();`);
emit(`app.endUndoGroup();`);
emit(`app.project.save(new File(PECA + "/CINCO-MOTIVOS-v9.aep"));`);
emit(`log("ok, " + COMP.numLayers + " camadas");`);
emit(`} catch (e) { log("ERRO: " + msg(e) + " linha " + linha(e)); }`);
emit(`app.endSuppressDialogs(false);`);

const js = out.join("\n").replace(/[^\x00-\x7F]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(path.join(AQUI, "monta-v9.jsx"), js);
console.log(`monta-v9.jsx: ${out.length} linhas, ${nEmit} instruções, ${QUADROS} quadros (${r3(DUR)} s), ${nb} blocos de legenda`);
