// Prova das camadas da extensão "precificacao" sem render (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 4.11).
// Uso: node render-2d.mjs [--saida <relatorio.json absoluto>]
//
// Empacota o render.tsx em memória (com o calço mínimo do Remotion, React de verdade) e desenha cada camada em
// HTML com o react-dom/server, quadro a quadro, a partir do estado da linha do tempo (as batidas da extensão no
// núcleo do K02). Nada de navegador nem de PNG. Confere:
// - as 23 camadas de componente desenham (vitrine com todas), e cada uma busca a mídia certa (icons, clay, splash);
// - camada com "grupo" não aparece solta (só dentro do grupo);
// - o grupo some com vis 0 e, no meio do push, leva o translate do Scene (o que sai e o que entra);
// - o flash põe o clarão branco por cima, com a opacidade do Broll;
// - a p2d-legenda desenha a frase do momento, com o modo por frase;
// - nenhuma camada lança erro em nenhum quadro.

import path from "node:path";
import { KIT, argSaida, empacota, gravaRelatorio, lerJson, pluginCalcos } from "./comum.mjs";

const ENTRADA = `
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
export { gsap, CustomEase, React, renderToStaticMarkup };
export { registraEases, novaTimeline } from "../../nucleo/eases";
export { novoEstado } from "../../nucleo/estado";
export { montaTimeline } from "../../nucleo/monta";
export * as ext from "./batidas";
export { render } from "./render";
export * as transicoes from "./transicoes";
export * as cortes from "./cortes";
`;

const m = (await empacota(ENTRADA, { nome: "render-k14.tsx", plugins: [pluginCalcos] })).modulo;
const { gsap, CustomEase, React, renderToStaticMarkup, registraEases, novaTimeline, novoEstado, montaTimeline, ext, render, transicoes, cortes } = m;
gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep();
registraEases(gsap, CustomEase);
const narr = lerJson(path.join(KIT, "pecas", "guia-pronta-2026-10-14", "voz", "narracao.json"));

// vitrine: as 23 camadas de componente num grupo só, com valores que mostram cada uma
const VITRINE = [
  { id: "v-at", tipo: "p2d-At", texto: "mais caro", tamanho: 120, cor: "#FFFFFF", fundo: "#1B1E24", raio: 30, padding: "8px 40px 16px", x: 540, y: 300 },
  { id: "v-bg", tipo: "p2d-Bg", kind: "dark" },
  { id: "v-numeral", tipo: "p2d-Numeral", n: 2, outline: true, x: 200, y: 600 },
  { id: "v-sticker", tipo: "p2d-Sticker", icon: "calendario", d: 230, x: 236, y: 770 },
  { id: "v-clay", tipo: "p2d-ClayCard", seq: "calculo", size: 400, x: 700, y: 700, estado: { frame: 60 } },
  { id: "v-bubble", tipo: "p2d-Bubble", text: "Perfeito, combinado.", side: "r", x: 700, y: 1000 },
  { id: "v-cal", tipo: "p2d-Calendar", month: "OUT", dur: 0.5, x: 540, y: 1200, estado: { acende: 0.6 } },
  { id: "v-stamp", tipo: "p2d-Stamp", text: "LOTADA", rot: -14, x: 540, y: 1300 },
  { id: "v-tag", tipo: "p2d-HangTag", x: 300, y: 1400 },
  { id: "v-lock", tipo: "p2d-Padlock", x: 800, y: 1400, estado: { shut: 1 } },
  { id: "v-odo", tipo: "p2d-YearOdo", x: 540, y: 1500, estado: { digit: 5.5 } },
  { id: "v-check", tipo: "p2d-Check", size: 98, x: 100, y: 1600, estado: { on: 0.5 } },
  { id: "v-dot", tipo: "p2d-NumDot", n: 3, size: 100, x: 220, y: 1600, estado: { cheio: 1 } },
  { id: "v-clock", tipo: "p2d-AlarmClock", x: 540, y: 1080, rot: -4, estado: { spin: 11, ring: 0.4 } },
  { id: "v-arrow", tipo: "p2d-BigArrow", w: 300, x: 900, y: 1600 },
  { id: "v-rays", tipo: "p2d-Rays", n: 20, giro: 12, x: 540, y: 1130 },
  { id: "v-conf", tipo: "p2d-Confetti", x: 540, y: 1060, n: 20, estado: { voo: 0.3 } },
  { id: "v-phone", tipo: "p2d-Phone", w: 300, x: 330, y: 1235, rot: -6 },
  { id: "v-eye", tipo: "p2d-Eye", w: 250, x: 752, y: 965, estado: { open: 1, look: 0.25 } },
  { id: "v-teto", tipo: "p2d-TetoCard", x: 735, y: 1290, estado: { fill: 0.8, val: 1 } },
  { id: "v-comment", tipo: "p2d-CommentIcon", w: 300, x: 540, y: 900 },
  { id: "v-pill", tipo: "p2d-Pill", texto: "agenda cheia", size: 30, x: 540, y: 1700 },
  { id: "v-spark", tipo: "p2d-Sparkle", color: "#FFFFFF", pulso: { base: 0.9, amp: 0.5, freq: 6, fase: 0 }, x: 170, y: 1408, flutua: { amp: 7, freq: 2.6, fase: 0 } },
].map((c) => ({ estado: {}, ...c, grupo: "vitrine" }));

const CAMADAS = [
  { id: "cena1", tipo: "p2d-grupo", fundo: "coral", estado: {} },
  { id: "cena2", tipo: "p2d-grupo", fundo: "paper", estado: {} },
  { id: "cena3", tipo: "p2d-grupo", fundo: "dark", estado: {} },
  { id: "vitrine", tipo: "p2d-grupo", fundo: null, estado: { vis: 1 } },
  { id: "num", tipo: "p2d-Numeral", grupo: "cena1", n: 1, x: 178, y: 1070, rot: -8, estado: {} },
  { id: "bolha", tipo: "p2d-Bubble", grupo: "cena2", text: "Tem horário na semana que vem?", side: "r", x: 960, y: 1590, estado: {} },
  { id: "olho", tipo: "p2d-Eye", grupo: "cena3", estado: { open: 0 } },
  { id: "solta", tipo: "p2d-Pill", texto: "camada solta", x: 540, y: 200, estado: {} },
  ...VITRINE,
  { id: "leg", tipo: "p2d-legenda", modos: ["coral", "light", "light", "dark"], fecho: false, estado: {} },
];
const BATIDAS = [
  { id: "p2d-entra", params: { camada: "num", t: 1.0 } },
  { id: "p2d-mola", params: { camada: "num", t: 2.0 } },
  { id: "p2d-treme", params: { camada: "cena1", t: 2.5 } },
  { id: "p2d-transicao", params: { tipo: "push", de: "cena1", para: "cena2", t: 4.0 } },
  { id: "p2d-corte", params: { tipo: "flash", de: "cena2", para: "cena3", t: 6.0 } },
  { id: "p2d-canal", params: { camada: "olho", t: 6.3, canal: "open", de: 0, para: 1, dur: 0.2, ease: "power2.out" } },
];

const props = {
  versao: 1, peca: "teste-k14", titulo: "Teste da biblioteca 2D", publicDir: "public-kit", fps: 30, largura: 1080, altura: 1920, duracao: 18, quadros: 540, tFecho: 15,
  narracao: { fps: 30, words: narr.words, phrases: narr.phrases },
  legenda: { top: 206, altura: 330, tamanho: 68, modo: "light" },
  camera: { x: 0, y: 0.004, z: 0.66, tx: 0, ty: -0.004, tz: 0, fov: 30 },
  ambiente: { deriva: true, flutuacao: true, poeira: 0.65, periodico: true },
  objetos: [], telas: {}, regioes: {}, marcas: {}, camadas: CAMADAS, batidas: BATIDAS,
  sons: { perfil: "v2", modoRuido: "por-evento", extras: [], remover: [] },
  trilha: { transporVerificado: 0 }, fecho: null,
};

const tl = novaTimeline(gsap);
const st = novoEstado(props);
const erros = [];
montaTimeline(tl, st, props, ext.batidas, { avisos: [], aoErro: (_o, e) => erros.push(e.message) });
tl.seek(0, false);
if (erros.length) {
  console.log("ERRO na cena: " + erros.join("; "));
  process.exit(1);
}

const desenha = (id, t) => {
  const c = props.camadas.filter((x) => x.id === id)[0];
  const Comp = render.camadas[c.tipo];
  return renderToStaticMarkup(React.createElement(Comp, { id, st, props, t }));
};

const QUADROS = [0, 30, 45, 60, 80, 105, 113, 114, 117, 120, 124, 126, 150, 178, 179, 180, 182, 185, 200, 300, 450, 539];
const rel = { versao: 1, geradoEm: new Date().toISOString(), quadros: QUADROS, checagens: [], tamanhos: {} };
let ok = true;
const confere = (nome, cond, detalhe = "") => {
  rel.checagens.push({ nome, passou: !!cond, detalhe });
  if (!cond) ok = false;
};

const html = {};
for (const q of QUADROS) {
  const t = q / 30;
  globalThis.__QUADRO_K14__ = q;
  tl.seek(t + 1e-4, false);
  html[q] = {};
  for (const c of props.camadas) {
    try {
      html[q][c.id] = desenha(c.id, t);
    } catch (e) {
      confere(`camada ${c.id} no quadro ${q} sem erro`, false, String(e && e.stack ? e.stack : e).slice(0, 400));
      html[q][c.id] = "";
    }
  }
}

// camadas com grupo não aparecem soltas
confere("camadas com grupo não aparecem soltas", QUADROS.every((q) => props.camadas.filter((c) => c.grupo).every((c) => html[q][c.id] === "")));
// a vitrine: todas as 23 camadas desenham alguma coisa dentro do grupo
{
  const v = html[150].vitrine;
  const faltam = VITRINE.filter((c) => {
    if (c.tipo === "p2d-Bg") return v.indexOf("radial-gradient(circle") < 0;
    if (c.tipo === "p2d-At") return v.indexOf("mais caro") < 0;
    if (c.tipo === "p2d-Bubble") return v.indexOf("Perfeito, combinado.") < 0;
    if (c.tipo === "p2d-Stamp") return v.indexOf("LOTADA") < 0;
    if (c.tipo === "p2d-Pill") return v.indexOf("agenda cheia") < 0;
    if (c.tipo === "p2d-Calendar") return v.indexOf("OUT") < 0;
    if (c.tipo === "p2d-TetoCard") return v.indexOf("TETO DO MEI") < 0 || v.indexOf("/icons/metricas.webp") < 0;
    if (c.tipo === "p2d-Sticker") return v.indexOf("/icons/calendario.webp") < 0;
    if (c.tipo === "p2d-ClayCard") return v.indexOf("/clay/calculo/060.jpg") < 0;
    if (c.tipo === "p2d-Phone") return v.indexOf("/splash.png") < 0;
    return false;
  });
  confere("as 23 camadas da vitrine desenham (com a mídia certa)", faltam.length === 0, faltam.map((c) => c.id).join(", "));
  rel.tamanhos.vitrine = v.length;
  // conta os At (cada camada de componente, menos o Bg, entra num At com translate -50% -50%)
  const ats = (v.match(/translate:-50% -50%/g) || []).length;
  confere("22 camadas posicionadas pelo At do kit.tsx", ats >= 22, `${ats} At`);
}
// grupos: visibilidade e transição push em 4,0 (janela 3,78 a 4,22)
confere("cena2 escondida antes da transição", html[105].cena2 === "");
confere("cena1 visível antes da transição", html[105].cena1.length > 0);
{
  const t = 117 / 30;
  const p = (t + 1e-4 - 3.78) / 0.44;
  const entra = transicoes.estiloEntrada("push", p, 540, 730).wrap.translate;
  const sai = transicoes.estiloSaida("push", p).wrap.translate;
  confere("no meio do push, a cena que entra leva o translate do Scene", html[117].cena2.indexOf(`translate:${entra}`) >= 0, entra);
  confere("no meio do push, a cena que sai leva o translate do Scene", html[117].cena1.indexOf(`translate:${sai}`) >= 0, sai);
}
confere("cena1 some depois da transição", html[150].cena1 === "");
// flash em 6,0
{
  const pre = html[179].cena2;
  const pos = html[180].cena3;
  const temClarao = (s) => /background:#FFFFFF;opacity:0\.\d+/.test(s);
  confere("antes da borda do flash, o clarão está na cena que sai", temClarao(pre));
  confere("depois da borda, a cena que sai sumiu e o clarão está na que entra", html[180].cena2 === "" && temClarao(pos));
  const t = 180 / 30 + 1e-4;
  const esperado = cortes.CLARAO.opacidade * cortes.claraoT(t, [6.0]);
  const achado = Number((/background:#FFFFFF;opacity:([0-9.]+)/.exec(pos) || [])[1]);
  confere("opacidade do clarão como a do Broll (0,85·clarão)", Math.abs(achado - esperado) < 1e-5, `${achado} contra ${esperado}`);
  confere("o clarão some depois de 0,2 s", !temClarao(html[200].cena3));
}
// legenda por cima, com a frase do momento
{
  const leg = html[150].leg;
  confere("a p2d-legenda desenha a frase do momento (frase 2, modo light)", leg.indexOf("sistema") >= 0 && leg.indexOf("z-index:200") >= 0);
  confere("camada solta no z 150", html[150].solta.indexOf("z-index:150") >= 0);
}
// câmera: a tremida e a mola entram no estilo do grupo
confere("a câmera do grupo leva a tremida (translate diferente de 0) no quadro 80", /translate:-?\d+\.\d\dpx -?\d+\.\d\dpx;transform-origin:50% 58%/.test(html[80].cena1) && html[80].cena1.indexOf("translate:0.00px 0.00px") < 0);

for (const r of rel.checagens) console.log(`${r.passou ? "ok   " : "FALHA"} ${r.nome}${r.detalhe ? ` (${r.detalhe})` : ""}`);
tl.kill();
gsap.ticker.sleep();
rel.passou = ok;
console.log(ok ? "\nRESULTADO: as camadas desenham em todos os quadros" : "\nRESULTADO: FALHOU");
const saida = argSaida(process.argv);
if (saida) {
  const g = await gravaRelatorio(saida, rel);
  console.log(`relatório: ${g.caminho} (${g.tamanho} bytes)`);
}
process.exit(ok ? 0 : 1);
