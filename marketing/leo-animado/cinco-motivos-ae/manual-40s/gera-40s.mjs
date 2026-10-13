// Gera o monta-40s.jsx: a base do reel "Cinco motivos" de 40 s no estilo do pin "Motion inspiration - Frames"
// (corte seco a cada 1 a 2 s, papel e tinta se alternando, tipografia bold com destaque coral, fita curva, tela do app).
// Pedido do Pedro (13/10/2026), depois de parar o computer use: "termine tudo via Skill do Remotion e MCP do After".
// O AE (pelo MCP, execute-script com $.evalFile deste arquivo) monta som, fundos, textos, fita, pílula e fecho; o
// Remotion põe o iPhone 3D por cima (Cinco40Celular). Tempos e textos: roteiro40.json (de roteiro40.py).
// Uso: node gera-40s.mjs   (grava monta-40s.jsx, só ASCII)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");
const R = JSON.parse(fs.readFileSync(path.join(AQUI, "roteiro40.json"), "utf8"));
const FPS = R.fps, TOTAL = R.total, FI = R.fecho;
const C = { tinta: "#15171C", papel: "#FAF8F5", coral: "#F2643C", branco: "#FFFFFF", fita: "#DCD6CE", luz: "#2A2E38", borda: "#0E0F12" };
const J = (v) => JSON.stringify(v);
const s = (f) => +(f / FPS).toFixed(4);
const out = [];
const emit = (x) => out.push(x);

emit(`var PECA = ${J(AQUI)};`);
emit(`var RESULT = { log: [] };
function log(x) { RESULT.log.push(String(x)); }
function msg(e) { try { return String(e.message); } catch (x) { try { return String(e); } catch (y) { return "erro sem texto"; } } }
function hx(c) { return [parseInt(c.substr(1, 2), 16) / 255, parseInt(c.substr(3, 2), 16) / 255, parseInt(c.substr(5, 2), 16) / 255]; }
function tl(L) { return L.property("ADBE Transform Group"); }
function cor4(p, c) { var a = hx(c); try { p.setValue([a[0], a[1], a[2], 1]); } catch (e) { p.setValue(a); } }
function efeito(L, nome) { return L.property("ADBE Effect Parade").addProperty(nome); }
function texto(comp, nome, txt, fonte, tam, c, just, track) {
  var L = comp.layers.addText(txt); L.name = nome;
  var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var d = P.value;
  try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
  d.text = txt; d.font = fonte; d.fontSize = tam; d.applyFill = true; d.fillColor = hx(c); d.applyStroke = false;
  d.justification = just; d.tracking = track; P.setValue(d); return L;
}
function rect(L) { return L.sourceRectAtTime(L.inPoint, false); }
// cabe na margem (x 96 a 984): diminui a fonte se passar de 888 px e empurra o centro pra dentro
function cabe(L, x, y, fx, fy) {
  var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var r = rect(L);
  if (r.width > 888) { var d = P.value; d.fontSize = Math.floor(d.fontSize * 880 / r.width); P.setValue(d); r = rect(L); }
  tl(L).property("ADBE Anchor Point").setValue([r.left + r.width * fx, r.top + r.height * fy]);
  var esq = x - r.width * fx, dir = esq + r.width;
  if (esq < 96) x += 96 - esq; if (dir > 984) x -= dir - 984;
  tl(L).property("ADBE Position").setValue([x, y]); return r;
}
function facil(P) { for (var k = 1; k <= P.numKeys; k++) { try { var n = P.value.length || 1; if (P.propertyValueType === PropertyValueType.TwoD_SPATIAL || P.propertyValueType === PropertyValueType.ThreeD_SPATIAL) n = 1; var e = []; for (var i = 0; i < n; i++) e.push(new KeyframeEase(0, 70)); P.setTemporalEaseAtKey(k, e, e); } catch (x) {} } }
// entrada da referência: 60% no corte, 106% 4 quadros depois, 100% mais 3 quadros; destaque com giro de -4 a 0
function pop(L, t0, base, giro) {
  var S = tl(L).property("ADBE Scale"), b = base || 100;
  S.setValueAtTime(t0, [0.6 * b, 0.6 * b, 100]); S.setValueAtTime(t0 + 4 / 30, [1.06 * b, 1.06 * b, 100]); S.setValueAtTime(t0 + 7 / 30, [b, b, 100]); facil(S);
  if (giro) { var G = tl(L).property("ADBE Rotate Z"), g0 = G.value; G.setValueAtTime(t0, g0 + giro); G.setValueAtTime(t0 + 7 / 30, g0); facil(G); }
  L.motionBlur = true;
}
function vida(L, a, b) { L.inPoint = a; L.outPoint = b; }
function brilho(L) { try { var g = efeito(L, "ADBE Glo2"); g.property("ADBE Glo2-0003").setValue(38); g.property("ADBE Glo2-0004").setValue(0.8); } catch (e) { log("brilho: " + msg(e)); } }
function sombra(L) { var f = efeito(L, "ADBE Drop Shadow"); cor4(f.property("ADBE Drop Shadow-0001"), "#000000"); f.property("ADBE Drop Shadow-0002").setValue(102); f.property("ADBE Drop Shadow-0003").setValue(180); f.property("ADBE Drop Shadow-0004").setValue(20); f.property("ADBE Drop Shadow-0005").setValue(60); }
function forma(comp, nome) { var L = comp.layers.addShape(); L.name = nome; tl(L).property("ADBE Anchor Point").setValue([0, 0]); tl(L).property("ADBE Position").setValue([0, 0]); return L; }
function cont(L, ix) { return L.property("ADBE Root Vectors Group").property(ix).property("ADBE Vectors Group"); }
function grupo(L, nome) { var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = nome; return g.propertyIndex; }
function shape(v, i, o) { var x = new Shape(); x.vertices = v; x.inTangents = i; x.outTangents = o; x.closed = false; return x; }
function purga() { try { app.purge(PurgeTarget.ALL_CACHES); } catch (e) {} }
var F8 = "Sora-ExtraBold", FS = "DMSerifDisplay-Italic";`);

emit(`var pasta = PECA + "/material/";
function imp(n) { return app.project.importFile(new ImportOptions(new File(pasta + n))); }
var M = {};
var arqs = ["01-narracao.wav", "02-fecho-vai-legalizai.wav", "03-trilha-house-one.mp3", "11-tela-emitir-nota.png", "12-tela-pro-labore.png", "20-logo-ai-tinta.png", "21-logo-ai-coral.png"];
for (var q = 0; q < arqs.length; q++) { try { M[arqs[q]] = imp(arqs[q]); } catch (e) { log("importar " + arqs[q] + ": " + msg(e)); } }
var COMP = app.project.items.addComp("CINCO-40S", 1080, 1920, 1, ${s(TOTAL)}, ${FPS});
COMP.bgColor = hx("${C.tinta}"); COMP.motionBlur = true; COMP.shutterAngle = 200; COMP.shutterPhase = -100;
log("comp e material ok");`);

// som: narração em 11 trechos, fecho e trilha com os níveis
R.narracao.forEach((n) => {
  emit(`try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao ${n.n}"; A.startTime = ${s(n.vai - n.entra)}; vida(A, ${s(n.vai)}, ${s(n.vai + n.sai - n.entra)}); } catch (e) { log("narracao ${n.n}: " + msg(e)); }`);
});
emit(`try { var Fv = COMP.layers.add(M["02-fecho-vai-legalizai.wav"]); Fv.name = "Fecho voz"; Fv.startTime = ${s(FI)}; Fv.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-1.3, -1.3]); } catch (e) { log("fecho voz: " + msg(e)); }
try { var Tr = COMP.layers.add(M["03-trilha-house-one.mp3"]); Tr.name = "Trilha House One"; Tr.startTime = -51.711; vida(Tr, 0, ${s(TOTAL)});
  var Nv = Tr.property("ADBE Audio Group").property("ADBE Audio Levels"); Nv.setValueAtTime(0, [-60, -60]); Nv.setValueAtTime(0.5, [-33, -33]); Nv.setValueAtTime(38.5, [-33, -33]); Nv.setValueAtTime(${s(TOTAL)}, [-60, -60]); } catch (e) { log("trilha: " + msg(e)); }
log("som ok"); purga();`);

// fitas: curva larga cruzando a tela, desenhando nos primeiros 10 quadros
const FITAS = [
  { v: [[1190, 300], [520, 380], [150, 950], [-110, 1560]], i: [[0, 0], [260, -40], [40, -260], [60, -140]], o: [[-260, 20], [-260, 40], [-40, 260], [0, 0]] },
  { v: [[-110, 1330], [540, 1560], [1190, 1300]], i: [[0, 0], [-330, 0], [-140, 120]], o: [[200, 140], [330, 0], [0, 0]] },
  { v: [[-110, 640], [540, 400], [1190, 620]], i: [[0, 0], [-330, 0], [-180, -110]], o: [[180, -110], [330, 0], [0, 0]] },
];
let nFita = 0;
const corDe = (c) => C[c] || C.tinta;
R.tomadas.forEach((t) => {
  const a = s(t.de), b = s(t.ate), sufixo = `T${t.n}`;
  emit(`// tomada ${t.n}`);
  if (t.fundo.startsWith("tinta")) {
    emit(`try { var Bg = COMP.layers.addSolid(hx("${C.tinta}"), "${sufixo} fundo tinta", 1080, 1920, 1, ${s(TOTAL)}); vida(Bg, ${a}, ${b});
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "${C.luz}"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "${C.borda}"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("${sufixo} fundo: " + msg(e)); }`);
  } else {
    emit(`try { var Bg = COMP.layers.addSolid(hx("${C.papel}"), "${sufixo} fundo papel", 1080, 1920, 1, ${s(TOTAL)}); vida(Bg, ${a}, ${b}); } catch (e) { log("${sufixo} fundo: " + msg(e)); }`);
  }
  const escuro = t.fundo.startsWith("tinta");
  let ordem = 0;
  // a fita nasce logo depois do fundo, pra ficar atrás do texto
  [...t.camadas.filter((c) => c[0] === "FITA"), ...t.camadas.filter((c) => c[0] !== "FITA")].forEach(([tx, fo, px, cor, x, y]) => {
    if (tx === "FITA") {
      const f = FITAS[nFita++ % FITAS.length];
      emit(`try { var Fi = forma(COMP, "${sufixo} fita"); var gi = grupo(Fi, "fita"); cont(Fi, gi).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shape(${J(f.v)}, ${J(f.i)}, ${J(f.o)}));
  var St = cont(Fi, gi).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(hx("${C.fita}")); St.property("ADBE Vector Stroke Width").setValue(70); St.property("ADBE Vector Stroke Line Cap").setValue(2);
  var Ap = cont(Fi, gi).addProperty("ADBE Vector Filter - Trim"); var Fim = Ap.property("ADBE Vector Trim End"); Fim.setValueAtTime(${a}, 0); Fim.setValueAtTime(${s(t.de + 10)}, 100); facil(Fim);
  vida(Fi, ${a}, ${b}); Fi.motionBlur = true; } catch (e) { log("${sufixo} fita: " + msg(e)); }`);
      return;
    }
    if (tx === "FECHO") return; // o fecho vem depois
    if (tx.startsWith("IMG")) {
      const arq = tx.split(" ")[1];
      if (arq.startsWith("13-") || arq.startsWith("14-")) return; // o celular é do Remotion
      const esc = Number((tx.match(/escala (\d+)%/) || [0, 34])[1]);
      const giro = (tx.match(/giro (-?\d+)/) || [0, 0])[1];
      emit(`try { var Im = COMP.layers.add(M["${arq}"]); Im.name = "${sufixo} ${arq}"; vida(Im, ${a}, ${b}); tl(Im).property("ADBE Position").setValue([${x || 540}, ${y}]); tl(Im).property("ADBE Rotate Z").setValue(${giro}); sombra(Im); pop(Im, ${a}, ${esc}, 0); } catch (e) { log("${sufixo} imagem: " + msg(e)); }`);
      ordem++;
      return;
    }
    if (tx.startsWith("PILULA")) {
      emit(`try { var Pl = forma(COMP, "${sufixo} pilula"); var gp = grupo(Pl, "pilula"); var Rr = cont(Pl, gp).addProperty("ADBE Vector Shape - Rect"); Rr.property("ADBE Vector Rect Size").setValue([620, 150]); Rr.property("ADBE Vector Rect Roundness").setValue(75);
  var Fl = cont(Pl, gp).addProperty("ADBE Vector Graphic - Fill"); Fl.property("ADBE Vector Fill Color").setValue(hx("${C.coral}"));
  tl(Pl).property("ADBE Position").setValue([540, ${y}]); vida(Pl, ${s(t.de + 3)}, ${b}); pop(Pl, ${s(t.de + 3)}, 100, -4); } catch (e) { log("${sufixo} pilula: " + msg(e)); }`);
      ordem++;
      return;
    }
    const fonte = fo === "Sora" ? "F8" : "FS";
    const cr = cor === "papel" ? (escuro ? C.papel : C.tinta) : cor === "tinta" ? C.tinta : cor === "branco" ? C.branco : C.coral;
    const destaque = cor === "coral";
    const atraso = ordem === 0 ? 0 : 3;
    const pilulaTexto = tx === "LINK DA BIO";
    const yy = pilulaTexto ? 1030 : y;
    emit(`try { var Tx = texto(COMP, ${J(sufixo + " " + tx)}, ${J(tx)}, ${fonte}, ${px}, "${cr}", ParagraphJustification.CENTER_JUSTIFY, ${pilulaTexto ? 40 : fonte === "F8" ? -15 : 0}); vida(Tx, ${s(t.de + atraso)}, ${b}); cabe(Tx, ${x || 540}, ${yy}, 0.5, 0.5); pop(Tx, ${s(t.de + atraso)}, 100, ${destaque ? -4 : 0});${destaque && escuro ? " brilho(Tx);" : ""} } catch (e) { log(${J(sufixo + " texto " + tx + ": ")} + msg(e)); }`);
    ordem++;
  });
  if (t.n % 6 === 0) emit(`purga(); log("ate a tomada ${t.n} ok");`);
});

// fecho: "Vai," + logo, o "aí" acende quando é dito, pílula LINK DA BIO pequena
{
  const t = R.tomadas[R.tomadas.length - 1], a = s(t.de), b = s(t.ate);
  emit(`try {
  var G = COMP.layers.addNull(); G.name = "Fecho assinatura"; tl(G).property("ADBE Anchor Point").setValue([0, 0]); tl(G).property("ADBE Position").setValue([540, 822]); vida(G, ${a}, ${b}); pop(G, ${a}, 100, 0);
  var V = texto(COMP, "Fecho Vai", "Vai,", F8, 106, "${C.tinta}", ParagraphJustification.LEFT_JUSTIFY, -35); vida(V, ${a}, ${b});
  var rv = rect(V); var wVai = rv.width, x0 = -(wVai + 28 + 590) / 2;
  tl(V).property("ADBE Anchor Point").setValue([rv.left, rv.top + rv.height / 2]); V.parent = G; tl(V).property("ADBE Position").setValue([x0, 6]); tl(V).property("ADBE Scale").setValue([100, 100, 100]); V.motionBlur = true;
  var nomes = ["20-logo-ai-tinta.png", "21-logo-ai-coral.png"];
  for (var q = 0; q < 2; q++) { var Lg = COMP.layers.add(M[nomes[q]]); Lg.name = "Fecho " + nomes[q]; vida(Lg, ${a}, ${b}); Lg.parent = G;
    tl(Lg).property("ADBE Scale").setValue([44.697, 44.697, 100]); tl(Lg).property("ADBE Position").setValue([x0 + wVai + 28 + 295, 0]); Lg.motionBlur = true;
    if (q == 1) { var Op = tl(Lg).property("ADBE Opacity"); Op.setValueAtTime(${s(FI + 28)}, 0); Op.setValueAtTime(${s(FI + 32)}, 100); } }
  var Pk = forma(COMP, "Fecho pilula"); var gk = grupo(Pk, "pilula"); var Rk = cont(Pk, gk).addProperty("ADBE Vector Shape - Rect"); Rk.property("ADBE Vector Rect Size").setValue([330, 70]); Rk.property("ADBE Vector Rect Roundness").setValue(35);
  var Fk = cont(Pk, gk).addProperty("ADBE Vector Graphic - Fill"); Fk.property("ADBE Vector Fill Color").setValue(hx("${C.coral}"));
  tl(Pk).property("ADBE Position").setValue([540, 995]); vida(Pk, ${s(FI + 38)}, ${b}); pop(Pk, ${s(FI + 38)}, 100, 0);
  var Tk = texto(COMP, "Fecho LINK DA BIO", "LINK DA BIO", F8, 34, "${C.branco}", ParagraphJustification.CENTER_JUSTIFY, 60); vida(Tk, ${s(FI + 38)}, ${b}); cabe(Tk, 540, 995, 0.5, 0.5); pop(Tk, ${s(FI + 38)}, 100, 0);
  log("fecho ok");
} catch (e) { log("fecho: " + msg(e)); }`);
}
emit(`var ruins = 0; for (var l = 1; l <= COMP.numLayers; l++) { var Ly = COMP.layer(l); if (Ly instanceof TextLayer) { var rr = rect(Ly); if (!(rr.width > 0)) { ruins++; log("texto vazio: " + Ly.name); } } }
app.project.save(new File(PECA + "/CINCO-40S.aep"));
log("ok, " + COMP.numLayers + " camadas, textos vazios: " + ruins);
RESULT;`);

const txt = out.join("\n").replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(path.join(AQUI, "monta-40s.jsx"), txt);
console.log(`monta-40s.jsx: ${out.length} blocos, ${R.tomadas.length} tomadas, ${R.narracao.length} trechos de narração`);
