var PECA = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/cinco-motivos-ae/manual-40s";
var RESULT = { log: [] };
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
// entrada da refer\u00eancia: 60% no corte, 106% 4 quadros depois, 100% mais 3 quadros; destaque com giro de -4 a 0
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
var F8 = "Sora-ExtraBold", FS = "DMSerifDisplay-Italic";
var pasta = PECA + "/material/";
function imp(n) { return app.project.importFile(new ImportOptions(new File(pasta + n))); }
var M = {};
var arqs = ["01-narracao.wav", "02-fecho-vai-legalizai.wav", "03-trilha-house-one.mp3", "11-tela-emitir-nota.png", "12-tela-pro-labore.png", "20-logo-ai-tinta.png", "21-logo-ai-coral.png"];
for (var q = 0; q < arqs.length; q++) { try { M[arqs[q]] = imp(arqs[q]); } catch (e) { log("importar " + arqs[q] + ": " + msg(e)); } }
var COMP = app.project.items.addComp("CINCO-40S", 1080, 1920, 1, 40, 30);
COMP.bgColor = hx("#15171C"); COMP.motionBlur = true; COMP.shutterAngle = 200; COMP.shutterPhase = -100;
log("comp e material ok");
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 1"; A.startTime = 0.1; vida(A, 0.1, 2.4667); } catch (e) { log("narracao 1: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 2"; A.startTime = -0.4667; vida(A, 2.5, 4.5333); } catch (e) { log("narracao 2: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 3"; A.startTime = -0.7667; vida(A, 4.5667, 7.3333); } catch (e) { log("narracao 3: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 4"; A.startTime = -1; vida(A, 7.3667, 14.2333); } catch (e) { log("narracao 4: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 5"; A.startTime = -1.4; vida(A, 14.2667, 17.7333); } catch (e) { log("narracao 5: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 6"; A.startTime = -1.6333; vida(A, 17.7667, 22.3333); } catch (e) { log("narracao 6: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 7"; A.startTime = -2.1; vida(A, 22.3667, 28.0667); } catch (e) { log("narracao 7: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 8"; A.startTime = -2.8667; vida(A, 28.1, 29.7); } catch (e) { log("narracao 8: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 9"; A.startTime = -3.1333; vida(A, 29.7333, 31.2333); } catch (e) { log("narracao 9: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 10"; A.startTime = -3.7; vida(A, 31.2667, 34.5667); } catch (e) { log("narracao 10: " + msg(e)); }
try { var A = COMP.layers.add(M["01-narracao.wav"]); A.name = "Narracao 11"; A.startTime = -7.3667; vida(A, 34.6, 38.2); } catch (e) { log("narracao 11: " + msg(e)); }
try { var Fv = COMP.layers.add(M["02-fecho-vai-legalizai.wav"]); Fv.name = "Fecho voz"; Fv.startTime = 38.3333; Fv.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-1.3, -1.3]); } catch (e) { log("fecho voz: " + msg(e)); }
try { var Tr = COMP.layers.add(M["03-trilha-house-one.mp3"]); Tr.name = "Trilha House One"; Tr.startTime = -51.711; vida(Tr, 0, 40);
  var Nv = Tr.property("ADBE Audio Group").property("ADBE Audio Levels"); Nv.setValueAtTime(0, [-60, -60]); Nv.setValueAtTime(0.5, [-33, -33]); Nv.setValueAtTime(38.5, [-33, -33]); Nv.setValueAtTime(40, [-60, -60]); } catch (e) { log("trilha: " + msg(e)); }
log("som ok"); purga();
// tomada 1
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T1 fundo papel", 1080, 1920, 1, 40); vida(Bg, 0, 1.5667); } catch (e) { log("T1 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T1 Ainda recebe pelo", "Ainda recebe pelo", F8, 72, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 0, 1.5667); cabe(Tx, 540, 860, 0.5, 0.5); pop(Tx, 0, 100, 0); } catch (e) { log("T1 texto Ainda recebe pelo: " + msg(e)); }
try { var Tx = texto(COMP, "T1 seu trabalho", "seu trabalho", F8, 150, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 0.1, 1.5667); cabe(Tx, 540, 1010, 0.5, 0.5); pop(Tx, 0.1, 100, 0); } catch (e) { log("T1 texto seu trabalho: " + msg(e)); }
// tomada 2
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T2 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 1.5667, 2.5);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T2 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T2 no", "no", F8, 80, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 1.5667, 2.5); cabe(Tx, 540, 820, 0.5, 0.5); pop(Tx, 1.5667, 100, 0); } catch (e) { log("T2 texto no: " + msg(e)); }
try { var Tx = texto(COMP, "T2 CPF?", "CPF?", F8, 260, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 1.6667, 2.5); cabe(Tx, 540, 1050, 0.5, 0.5); pop(Tx, 1.6667, 100, -4); brilho(Tx); } catch (e) { log("T2 texto CPF?: " + msg(e)); }
// tomada 3
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T3 fundo papel", 1080, 1920, 1, 40); vida(Bg, 2.5, 3.4667); } catch (e) { log("T3 fundo: " + msg(e)); }
try { var Fi = forma(COMP, "T3 fita"); var gi = grupo(Fi, "fita"); cont(Fi, gi).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shape([[1190,300],[520,380],[150,950],[-110,1560]], [[0,0],[260,-40],[40,-260],[60,-140]], [[-260,20],[-260,40],[-40,260],[0,0]]));
  var St = cont(Fi, gi).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(hx("#DCD6CE")); St.property("ADBE Vector Stroke Width").setValue(70); St.property("ADBE Vector Stroke Line Cap").setValue(2);
  var Ap = cont(Fi, gi).addProperty("ADBE Vector Filter - Trim"); var Fim = Ap.property("ADBE Vector Trim End"); Fim.setValueAtTime(2.5, 0); Fim.setValueAtTime(2.8333, 100); facil(Fim);
  vida(Fi, 2.5, 3.4667); Fi.motionBlur = true; } catch (e) { log("T3 fita: " + msg(e)); }
try { var Tx = texto(COMP, "T3 5", "5", F8, 520, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 2.5, 3.4667); cabe(Tx, 540, 920, 0.5, 0.5); pop(Tx, 2.5, 100, -4); } catch (e) { log("T3 texto 5: " + msg(e)); }
try { var Tx = texto(COMP, "T3 motivos", "motivos", FS, 170, "#15171C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 2.6, 3.4667); cabe(Tx, 540, 1240, 0.5, 0.5); pop(Tx, 2.6, 100, 0); } catch (e) { log("T3 texto motivos: " + msg(e)); }
// tomada 4
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T4 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 3.4667, 4.5667);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T4 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T4 pra ter", "pra ter", F8, 90, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 3.4667, 4.5667); cabe(Tx, 540, 820, 0.5, 0.5); pop(Tx, 3.4667, 100, 0); } catch (e) { log("T4 texto pra ter: " + msg(e)); }
try { var Tx = texto(COMP, "T4 CNPJ.", "CNPJ.", F8, 230, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 3.5667, 4.5667); cabe(Tx, 540, 1040, 0.5, 0.5); pop(Tx, 3.5667, 100, -4); brilho(Tx); } catch (e) { log("T4 texto CNPJ.: " + msg(e)); }
// tomada 5
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T5 fundo papel", 1080, 1920, 1, 40); vida(Bg, 4.5667, 6.1333); } catch (e) { log("T5 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T5 1", "1", F8, 460, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 4.5667, 6.1333); cabe(Tx, 540, 860, 0.5, 0.5); pop(Tx, 4.5667, 100, -4); } catch (e) { log("T5 texto 1: " + msg(e)); }
try { var Tx = texto(COMP, "T5 no MEI,", "no MEI,", F8, 120, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 4.6667, 6.1333); cabe(Tx, 540, 1150, 0.5, 0.5); pop(Tx, 4.6667, 100, 0); } catch (e) { log("T5 texto no MEI,: " + msg(e)); }
// tomada 6
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T6 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 6.1333, 7.3667);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T6 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T6 a guia \u00e9", "a guia \u00e9", F8, 100, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 6.1333, 7.3667); cabe(Tx, 540, 850, 0.5, 0.5); pop(Tx, 6.1333, 100, 0); } catch (e) { log("T6 texto a guia \u00e9: " + msg(e)); }
try { var Tx = texto(COMP, "T6 fixa.", "fixa.", FS, 230, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 6.2333, 7.3667); cabe(Tx, 540, 1060, 0.5, 0.5); pop(Tx, 6.2333, 100, -4); brilho(Tx); } catch (e) { log("T6 texto fixa.: " + msg(e)); }
purga(); log("ate a tomada 6 ok");
// tomada 7
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T7 fundo papel", 1080, 1920, 1, 40); vida(Bg, 7.3667, 8.2667); } catch (e) { log("T7 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T7 Fature de", "Fature de", F8, 100, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 7.3667, 8.2667); cabe(Tx, 540, 820, 0.5, 0.5); pop(Tx, 7.3667, 100, 0); } catch (e) { log("T7 texto Fature de: " + msg(e)); }
try { var Tx = texto(COMP, "T7 R$ 1", "R$ 1", F8, 300, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 7.4667, 8.2667); cabe(Tx, 540, 1080, 0.5, 0.5); pop(Tx, 7.4667, 100, -4); } catch (e) { log("T7 texto R$ 1: " + msg(e)); }
// tomada 8
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T8 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 8.2667, 10.6333);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T8 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T8 at\u00e9 o teto de", "at\u00e9 o teto de", F8, 90, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 8.2667, 10.6333); cabe(Tx, 540, 760, 0.5, 0.5); pop(Tx, 8.2667, 100, 0); } catch (e) { log("T8 texto at\u00e9 o teto de: " + msg(e)); }
try { var Tx = texto(COMP, "T8 R$ 81 mil", "R$ 81 mil", F8, 200, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 8.3667, 10.6333); cabe(Tx, 540, 960, 0.5, 0.5); pop(Tx, 8.3667, 100, -4); brilho(Tx); } catch (e) { log("T8 texto R$ 81 mil: " + msg(e)); }
try { var Tx = texto(COMP, "T8 por ano", "por ano", F8, 80, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 8.3667, 10.6333); cabe(Tx, 540, 1110, 0.5, 0.5); pop(Tx, 8.3667, 100, 0); } catch (e) { log("T8 texto por ano: " + msg(e)); }
// tomada 9
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T9 fundo papel", 1080, 1920, 1, 40); vida(Bg, 10.6333, 11.3); } catch (e) { log("T9 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T9 exatamente", "exatamente", FS, 190, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 10.6333, 11.3); cabe(Tx, 540, 980, 0.5, 0.5); pop(Tx, 10.6333, 100, -4); } catch (e) { log("T9 texto exatamente: " + msg(e)); }
// tomada 10
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T10 fundo papel", 1080, 1920, 1, 40); vida(Bg, 11.3, 14.2667); } catch (e) { log("T10 fundo: " + msg(e)); }
try { var Fi = forma(COMP, "T10 fita"); var gi = grupo(Fi, "fita"); cont(Fi, gi).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shape([[-110,1330],[540,1560],[1190,1300]], [[0,0],[-330,0],[-140,120]], [[200,140],[330,0],[0,0]]));
  var St = cont(Fi, gi).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(hx("#DCD6CE")); St.property("ADBE Vector Stroke Width").setValue(70); St.property("ADBE Vector Stroke Line Cap").setValue(2);
  var Ap = cont(Fi, gi).addProperty("ADBE Vector Filter - Trim"); var Fim = Ap.property("ADBE Vector Trim End"); Fim.setValueAtTime(11.3, 0); Fim.setValueAtTime(11.6333, 100); facil(Fim);
  vida(Fi, 11.3, 14.2667); Fi.motionBlur = true; } catch (e) { log("T10 fita: " + msg(e)); }
try { var Tx = texto(COMP, "T10 R$ 6.750", "R$ 6.750", F8, 230, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 11.3, 14.2667); cabe(Tx, 540, 930, 0.5, 0.5); pop(Tx, 11.3, 100, 0); } catch (e) { log("T10 texto R$ 6.750: " + msg(e)); }
try { var Tx = texto(COMP, "T10 por m\u00eas", "por m\u00eas", FS, 140, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 11.4, 14.2667); cabe(Tx, 540, 1110, 0.5, 0.5); pop(Tx, 11.4, 100, -4); } catch (e) { log("T10 texto por m\u00eas: " + msg(e)); }
// tomada 11
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T11 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 14.2667, 15.8667);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T11 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T11 2", "2", F8, 460, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 14.2667, 15.8667); cabe(Tx, 540, 880, 0.5, 0.5); pop(Tx, 14.2667, 100, -4); brilho(Tx); } catch (e) { log("T11 texto 2: " + msg(e)); }
try { var Tx = texto(COMP, "T11 numa microempresa", "numa microempresa", F8, 96, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 14.3667, 15.8667); cabe(Tx, 540, 1130, 0.5, 0.5); pop(Tx, 14.3667, 100, 0); } catch (e) { log("T11 texto numa microempresa: " + msg(e)); }
// tomada 12
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T12 fundo papel", 1080, 1920, 1, 40); vida(Bg, 15.8667, 17.7667); } catch (e) { log("T12 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T12 que come\u00e7a em", "que come\u00e7a em", F8, 96, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 15.8667, 17.7667); cabe(Tx, 540, 780, 0.5, 0.5); pop(Tx, 15.8667, 100, 0); } catch (e) { log("T12 texto que come\u00e7a em: " + msg(e)); }
try { var Tx = texto(COMP, "T12 6%", "6%", F8, 420, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 15.9667, 17.7667); cabe(Tx, 540, 1100, 0.5, 0.5); pop(Tx, 15.9667, 100, -4); } catch (e) { log("T12 texto 6%: " + msg(e)); }
purga(); log("ate a tomada 12 ok");
// tomada 13
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T13 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 17.7667, 19.7667);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T13 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T13 de R$ 10 mil,", "de R$ 10 mil,", F8, 96, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 17.7667, 19.7667); cabe(Tx, 540, 760, 0.5, 0.5); pop(Tx, 17.7667, 100, 0); } catch (e) { log("T13 texto de R$ 10 mil,: " + msg(e)); }
try { var Tx = texto(COMP, "T13 R$ 600", "R$ 600", F8, 240, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 17.8667, 19.7667); cabe(Tx, 540, 980, 0.5, 0.5); pop(Tx, 17.8667, 100, -4); brilho(Tx); } catch (e) { log("T13 texto R$ 600: " + msg(e)); }
try { var Tx = texto(COMP, "T13 de imposto", "de imposto", F8, 90, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 17.8667, 19.7667); cabe(Tx, 540, 1130, 0.5, 0.5); pop(Tx, 17.8667, 100, 0); } catch (e) { log("T13 texto de imposto: " + msg(e)); }
// tomada 14
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T14 fundo papel", 1080, 1920, 1, 40); vida(Bg, 19.7667, 22.3667); } catch (e) { log("T14 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T14 R$ 9.400", "R$ 9.400", F8, 230, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 19.7667, 22.3667); cabe(Tx, 540, 930, 0.5, 0.5); pop(Tx, 19.7667, 100, 0); } catch (e) { log("T14 texto R$ 9.400: " + msg(e)); }
try { var Tx = texto(COMP, "T14 no bolso.", "no bolso.", FS, 170, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 19.8667, 22.3667); cabe(Tx, 540, 1120, 0.5, 0.5); pop(Tx, 19.8667, 100, -4); } catch (e) { log("T14 texto no bolso.: " + msg(e)); }
// tomada 15
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T15 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 22.3667, 24.2333);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T15 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T15 3", "3", F8, 460, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 22.3667, 24.2333); cabe(Tx, 540, 880, 0.5, 0.5); pop(Tx, 22.3667, 100, -4); brilho(Tx); } catch (e) { log("T15 texto 3: " + msg(e)); }
try { var Tx = texto(COMP, "T15 na microempresa,", "na microempresa,", F8, 96, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 22.4667, 24.2333); cabe(Tx, 540, 1130, 0.5, 0.5); pop(Tx, 22.4667, 100, 0); } catch (e) { log("T15 texto na microempresa,: " + msg(e)); }
// tomada 16
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T16 fundo papel", 1080, 1920, 1, 40); vida(Bg, 24.2333, 25.2); } catch (e) { log("T16 fundo: " + msg(e)); }
try { var Im = COMP.layers.add(M["12-tela-pro-labore.png"]); Im.name = "T16 12-tela-pro-labore.png"; vida(Im, 24.2333, 25.2); tl(Im).property("ADBE Position").setValue([540, 730]); tl(Im).property("ADBE Rotate Z").setValue(-5); sombra(Im); pop(Im, 24.2333, 31, 0); } catch (e) { log("T16 imagem: " + msg(e)); }
try { var Tx = texto(COMP, "T16 seu sal\u00e1rio", "seu sal\u00e1rio", F8, 110, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 24.3333, 25.2); cabe(Tx, 540, 1270, 0.5, 0.5); pop(Tx, 24.3333, 100, 0); } catch (e) { log("T16 texto seu sal\u00e1rio: " + msg(e)); }
try { var Tx = texto(COMP, "T16 de dono", "de dono", FS, 150, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 24.3333, 25.2); cabe(Tx, 540, 1420, 0.5, 0.5); pop(Tx, 24.3333, 100, -4); } catch (e) { log("T16 texto de dono: " + msg(e)); }
// tomada 17
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T17 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 25.2, 26.4667);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T17 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T17 recolhe", "recolhe", F8, 100, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 25.2, 26.4667); cabe(Tx, 540, 840, 0.5, 0.5); pop(Tx, 25.2, 100, 0); } catch (e) { log("T17 texto recolhe: " + msg(e)); }
try { var Tx = texto(COMP, "T17 INSS", "INSS", F8, 260, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 25.3, 26.4667); cabe(Tx, 540, 1080, 0.5, 0.5); pop(Tx, 25.3, 100, -4); brilho(Tx); } catch (e) { log("T17 texto INSS: " + msg(e)); }
// tomada 18
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T18 fundo papel", 1080, 1920, 1, 40); vida(Bg, 26.4667, 28.1); } catch (e) { log("T18 fundo: " + msg(e)); }
try { var Fi = forma(COMP, "T18 fita"); var gi = grupo(Fi, "fita"); cont(Fi, gi).addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(shape([[-110,640],[540,400],[1190,620]], [[0,0],[-330,0],[-180,-110]], [[180,-110],[330,0],[0,0]]));
  var St = cont(Fi, gi).addProperty("ADBE Vector Graphic - Stroke"); St.property("ADBE Vector Stroke Color").setValue(hx("#DCD6CE")); St.property("ADBE Vector Stroke Width").setValue(70); St.property("ADBE Vector Stroke Line Cap").setValue(2);
  var Ap = cont(Fi, gi).addProperty("ADBE Vector Filter - Trim"); var Fim = Ap.property("ADBE Vector Trim End"); Fim.setValueAtTime(26.4667, 0); Fim.setValueAtTime(26.8, 100); facil(Fim);
  vida(Fi, 26.4667, 28.1); Fi.motionBlur = true; } catch (e) { log("T18 fita: " + msg(e)); }
try { var Tx = texto(COMP, "T18 pra sua", "pra sua", F8, 100, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 26.4667, 28.1); cabe(Tx, 540, 860, 0.5, 0.5); pop(Tx, 26.4667, 100, 0); } catch (e) { log("T18 texto pra sua: " + msg(e)); }
try { var Tx = texto(COMP, "T18 aposentadoria.", "aposentadoria.", FS, 125, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 26.5667, 28.1); cabe(Tx, 540, 1040, 0.5, 0.5); pop(Tx, 26.5667, 100, -4); } catch (e) { log("T18 texto aposentadoria.: " + msg(e)); }
purga(); log("ate a tomada 18 ok");
// tomada 19
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T19 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 28.1, 29.7333);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T19 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T19 4", "4", F8, 380, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 28.1, 29.7333); cabe(Tx, 280, 720, 0.5, 0.5); pop(Tx, 28.1, 100, -4); brilho(Tx); } catch (e) { log("T19 texto 4: " + msg(e)); }
try { var Tx = texto(COMP, "T19 o app", "o app", F8, 90, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 28.2, 29.7333); cabe(Tx, 280, 980, 0.5, 0.5); pop(Tx, 28.2, 100, 0); } catch (e) { log("T19 texto o app: " + msg(e)); }
try { var Tx = texto(COMP, "T19 calcula.", "calcula.", FS, 120, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 28.2, 29.7333); cabe(Tx, 300, 1140, 0.5, 0.5); pop(Tx, 28.2, 100, -4); brilho(Tx); } catch (e) { log("T19 texto calcula.: " + msg(e)); }
// tomada 20
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T20 fundo papel", 1080, 1920, 1, 40); vida(Bg, 29.7333, 31.2667); } catch (e) { log("T20 fundo: " + msg(e)); }
try { var Im = COMP.layers.add(M["11-tela-emitir-nota.png"]); Im.name = "T20 11-tela-emitir-nota.png"; vida(Im, 29.7333, 31.2667); tl(Im).property("ADBE Position").setValue([540, 700]); tl(Im).property("ADBE Rotate Z").setValue(0); sombra(Im); pop(Im, 29.7333, 32, 0); } catch (e) { log("T20 imagem: " + msg(e)); }
try { var Tx = texto(COMP, "T20 Voc\u00ea emite a nota", "Voc\u00ea emite a nota", F8, 90, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 29.8333, 31.2667); cabe(Tx, 540, 1290, 0.5, 0.5); pop(Tx, 29.8333, 100, 0); } catch (e) { log("T20 texto Voc\u00ea emite a nota: " + msg(e)); }
try { var Tx = texto(COMP, "T20 e paga.", "e paga.", FS, 150, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 29.8333, 31.2667); cabe(Tx, 540, 1430, 0.5, 0.5); pop(Tx, 29.8333, 100, -4); } catch (e) { log("T20 texto e paga.: " + msg(e)); }
// tomada 21
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T21 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 31.2667, 32.8);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T21 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T21 5", "5", F8, 460, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 31.2667, 32.8); cabe(Tx, 540, 880, 0.5, 0.5); pop(Tx, 31.2667, 100, -4); brilho(Tx); } catch (e) { log("T21 texto 5: " + msg(e)); }
try { var Tx = texto(COMP, "T21 a abertura", "a abertura", F8, 110, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 31.3667, 32.8); cabe(Tx, 540, 1140, 0.5, 0.5); pop(Tx, 31.3667, 100, 0); } catch (e) { log("T21 texto a abertura: " + msg(e)); }
// tomada 22
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T22 fundo papel", 1080, 1920, 1, 40); vida(Bg, 32.8, 33.5667); } catch (e) { log("T22 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T22 \u00e9 com a", "\u00e9 com a", F8, 90, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 32.8, 33.5667); cabe(Tx, 280, 860, 0.5, 0.5); pop(Tx, 32.8, 100, 0); } catch (e) { log("T22 texto \u00e9 com a: " + msg(e)); }
try { var Tx = texto(COMP, "T22 gente,", "gente,", FS, 150, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 32.9, 33.5667); cabe(Tx, 290, 1020, 0.5, 0.5); pop(Tx, 32.9, 100, -4); } catch (e) { log("T22 texto gente,: " + msg(e)); }
// tomada 23
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T23 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 33.5667, 34.6);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T23 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T23 sem", "sem", F8, 110, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 33.5667, 34.6); cabe(Tx, 540, 840, 0.5, 0.5); pop(Tx, 33.5667, 100, 0); } catch (e) { log("T23 texto sem: " + msg(e)); }
try { var Tx = texto(COMP, "T23 honor\u00e1rio.", "honor\u00e1rio.", FS, 180, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 33.6667, 34.6); cabe(Tx, 540, 1040, 0.5, 0.5); pop(Tx, 33.6667, 100, -4); brilho(Tx); } catch (e) { log("T23 texto honor\u00e1rio.: " + msg(e)); }
// tomada 24
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T24 fundo papel", 1080, 1920, 1, 40); vida(Bg, 34.6, 35.6333); } catch (e) { log("T24 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T24 clique no", "clique no", F8, 100, "#15171C", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 34.6, 35.6333); cabe(Tx, 540, 820, 0.5, 0.5); pop(Tx, 34.6, 100, 0); } catch (e) { log("T24 texto clique no: " + msg(e)); }
try { var Pl = forma(COMP, "T24 pilula"); var gp = grupo(Pl, "pilula"); var Rr = cont(Pl, gp).addProperty("ADBE Vector Shape - Rect"); Rr.property("ADBE Vector Rect Size").setValue([620, 150]); Rr.property("ADBE Vector Rect Roundness").setValue(75);
  var Fl = cont(Pl, gp).addProperty("ADBE Vector Graphic - Fill"); Fl.property("ADBE Vector Fill Color").setValue(hx("#F2643C"));
  tl(Pl).property("ADBE Position").setValue([540, 1030]); vida(Pl, 34.7, 35.6333); pop(Pl, 34.7, 100, -4); } catch (e) { log("T24 pilula: " + msg(e)); }
try { var Tx = texto(COMP, "T24 LINK DA BIO", "LINK DA BIO", F8, 80, "#FFFFFF", ParagraphJustification.CENTER_JUSTIFY, 40); vida(Tx, 34.7, 35.6333); cabe(Tx, 540, 1030, 0.5, 0.5); pop(Tx, 34.7, 100, 0); } catch (e) { log("T24 texto LINK DA BIO: " + msg(e)); }
purga(); log("ate a tomada 24 ok");
// tomada 25
try { var Bg = COMP.layers.addSolid(hx("#15171C"), "T25 fundo tinta", 1080, 1920, 1, 40); vida(Bg, 35.6333, 38.2333);
  var Rp = efeito(Bg, "ADBE Ramp"); Rp.property("ADBE Ramp-0001").setValue([540, 880]); cor4(Rp.property("ADBE Ramp-0002"), "#2A2E38"); Rp.property("ADBE Ramp-0003").setValue([540, 2050]); cor4(Rp.property("ADBE Ramp-0004"), "#0E0F12"); Rp.property("ADBE Ramp-0005").setValue(2); try { Rp.property("ADBE Ramp-0006").setValue(16); } catch (e) { log("dispersao: " + msg(e)); }
  try { var Nz = efeito(Bg, "ADBE Noise"); Nz.property("ADBE Noise-0001").setValue(4); Nz.property("ADBE Noise-0002").setValue(0); } catch (e) { log("grao: " + msg(e)); } } catch (e) { log("T25 fundo: " + msg(e)); }
try { var Tx = texto(COMP, "T25 entre na", "entre na", F8, 90, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 35.6333, 38.2333); cabe(Tx, 540, 760, 0.5, 0.5); pop(Tx, 35.6333, 100, 0); } catch (e) { log("T25 texto entre na: " + msg(e)); }
try { var Tx = texto(COMP, "T25 lista de espera", "lista de espera", FS, 150, "#F2643C", ParagraphJustification.CENTER_JUSTIFY, 0); vida(Tx, 35.7333, 38.2333); cabe(Tx, 540, 940, 0.5, 0.5); pop(Tx, 35.7333, 100, -4); brilho(Tx); } catch (e) { log("T25 texto lista de espera: " + msg(e)); }
try { var Tx = texto(COMP, "T25 do app que t\u00e1 chegando.", "do app que t\u00e1 chegando.", F8, 64, "#FAF8F5", ParagraphJustification.CENTER_JUSTIFY, -15); vida(Tx, 35.7333, 38.2333); cabe(Tx, 540, 1100, 0.5, 0.5); pop(Tx, 35.7333, 100, 0); } catch (e) { log("T25 texto do app que t\u00e1 chegando.: " + msg(e)); }
// tomada 26
try { var Bg = COMP.layers.addSolid(hx("#FAF8F5"), "T26 fundo papel", 1080, 1920, 1, 40); vida(Bg, 38.2333, 40); } catch (e) { log("T26 fundo: " + msg(e)); }
try {
  var G = COMP.layers.addNull(); G.name = "Fecho assinatura"; tl(G).property("ADBE Anchor Point").setValue([0, 0]); tl(G).property("ADBE Position").setValue([540, 822]); vida(G, 38.2333, 40); pop(G, 38.2333, 100, 0);
  var V = texto(COMP, "Fecho Vai", "Vai,", F8, 106, "#15171C", ParagraphJustification.LEFT_JUSTIFY, -35); vida(V, 38.2333, 40);
  var rv = rect(V); var wVai = rv.width, x0 = -(wVai + 28 + 590) / 2;
  tl(V).property("ADBE Anchor Point").setValue([rv.left, rv.top + rv.height / 2]); V.parent = G; tl(V).property("ADBE Position").setValue([x0, 6]); tl(V).property("ADBE Scale").setValue([100, 100, 100]); V.motionBlur = true;
  var nomes = ["20-logo-ai-tinta.png", "21-logo-ai-coral.png"];
  for (var q = 0; q < 2; q++) { var Lg = COMP.layers.add(M[nomes[q]]); Lg.name = "Fecho " + nomes[q]; vida(Lg, 38.2333, 40); Lg.parent = G;
    tl(Lg).property("ADBE Scale").setValue([44.697, 44.697, 100]); tl(Lg).property("ADBE Position").setValue([x0 + wVai + 28 + 295, 0]); Lg.motionBlur = true;
    if (q == 1) { var Op = tl(Lg).property("ADBE Opacity"); Op.setValueAtTime(39.2667, 0); Op.setValueAtTime(39.4, 100); } }
  var Pk = forma(COMP, "Fecho pilula"); var gk = grupo(Pk, "pilula"); var Rk = cont(Pk, gk).addProperty("ADBE Vector Shape - Rect"); Rk.property("ADBE Vector Rect Size").setValue([330, 70]); Rk.property("ADBE Vector Rect Roundness").setValue(35);
  var Fk = cont(Pk, gk).addProperty("ADBE Vector Graphic - Fill"); Fk.property("ADBE Vector Fill Color").setValue(hx("#F2643C"));
  tl(Pk).property("ADBE Position").setValue([540, 995]); vida(Pk, 39.6, 40); pop(Pk, 39.6, 100, 0);
  var Tk = texto(COMP, "Fecho LINK DA BIO", "LINK DA BIO", F8, 34, "#FFFFFF", ParagraphJustification.CENTER_JUSTIFY, 60); vida(Tk, 39.6, 40); cabe(Tk, 540, 995, 0.5, 0.5); pop(Tk, 39.6, 100, 0);
  log("fecho ok");
} catch (e) { log("fecho: " + msg(e)); }
var ruins = 0; for (var l = 1; l <= COMP.numLayers; l++) { var Ly = COMP.layer(l); if (Ly instanceof TextLayer) { var rr = rect(Ly); if (!(rr.width > 0)) { ruins++; log("texto vazio: " + Ly.name); } } }
app.project.save(new File(PECA + "/CINCO-40S.aep"));
log("ok, " + COMP.numLayers + " camadas, textos vazios: " + ruins);
RESULT;