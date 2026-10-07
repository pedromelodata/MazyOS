// Monta um .jsx mínimo que reproduz só a camada "Pausado" com as mesmas funções da montagem.
// Serve pra saber se o travamento vem da instrução em si ou do estado acumulado do projeto.
import { readFileSync, writeFileSync } from "node:fs";

const AQUI = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/sufoco-linha-ae";
const M = `${AQUI}/marcos.log`;
const lib = readFileSync(`${AQUI}/monta.jsx`, "utf8").split("\n").slice(0, 74).join("\n");

const V = [[-13.507, -31.959], [31.464, -6.066], [31.464, 6.066], [-13.507, 31.959], [-24, 25.892], [-24, -25.892]];
const I = [[-4.667, -2.687], [0, 0], [4.676, -2.692], [0, 0], [0, 5.385], [0, 0]];
const O = [[0, 0], [4.676, 2.692], [0, 0], [-4.667, 2.687], [0, 0], [0, -5.385]];
const J = JSON.stringify;

const corpo = `
var MARCOS = new File(${J(M)});
function marco(s) { MARCOS.encoding = "UTF-8"; MARCOS.open("a"); MARCOS.writeln(s); MARCOS.close(); }
(function () { var f = new File(${J(M)}); f.open("w"); f.write(""); f.close(); })();
app.beginSuppressDialogs();
try {
  app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
  app.newProject();
  var COMP = app.project.items.addComp("teste pausado", 1080, 1920, 1, 24.8, 30);
  var ALVO = COMP;
  COMP.motionBlur = true; COMP.shutterAngle = 180; COMP.motionBlurSamplesPerFrame = 12; COMP.motionBlurAdaptiveSampleLimit = 48;
  marco("1 comp");
  var MUNDO = COMP.layers.addNull(); MUNDO.name = "MUNDO";
  tl(MUNDO).property("ADBE Anchor Point").setValue([0, 0]); tl(MUNDO).property("ADBE Position").setValue([0, 0]);
  marco("2 nulo");
  var L = novaForma("Pausado (como no YouTube)", MUNDO, 480, 8405);
  marco("3 camada");
  var g1 = grp(H(L, []), "c\\u00edrculo");
  marco("4 grupo circulo");
  eli(g1, 168, 168, 0, 0);
  marco("5 eli");
  fil(g1, "#000000", 58);
  marco("6 fil circulo");
  var g2 = grp(H(L, []), "play");
  marco("7 grupo play");
  cam(g2, ${J(V)}, ${J(I)}, ${J(O)}, true);
  marco("8 cam");
  fil(g2, "#FFFFFF");
  marco("9 fil play");
  tfg(g2).property("ADBE Vector Position").setValue([6, 0]);
  marco("10 posicao do grupo");
  tl(L).property("ADBE Scale").setValue([0, 0, 100]);
  marco("11 escala zero");
  kf(tl(L).property("ADBE Scale"), [[14.12, [0, 0, 100], "o"], [14.38, [112, 112, 100], "io"], [14.54, [100, 100, 100], "io"]]);
  marco("12 chaves de escala");
  reordena(raiz(L));
  marco("13 reordena");
  marco("FIM OK");
} catch (err) { marco("ERRO: " + err.toString() + " (linha " + err.line + ")"); }
app.endSuppressDialogs(false);
`;

writeFileSync(`${AQUI}/teste-pausado.jsx`, lib + "\n" + corpo);
console.log("teste-pausado.jsx escrito");
