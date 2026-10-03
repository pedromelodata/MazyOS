// Prova das batidas da extensão "precificacao" na linha do tempo do kit (dono K14; KIT/DESENHO.md, 4.3 e 4.10).
// Uso: node batidas-2d.mjs [--saida <relatorio.json absoluto>]
//
// Monta uma cena de teste em Node (núcleo do K02 + batidas da extensão, empacotados em memória), com a narração
// da peça do guia, e confere quadro a quadro (seek em q/30 + 1e-4, como o render):
// - p2d-entra contra o inn do kit.tsx; p2d-mola contra o spring (duas molas seguidas se somam); p2d-treme contra
//   o shake; p2d-canal linear; p2d-sai como o leave (1 - outCubic);
// - p2d-transicao (push) e p2d-corte (flash): visibilidade, progresso e clarão contra as fórmulas do original;
// - a mesma cena com as batidas em outra ordem dá o mesmo estado (os fromTo não dependem da ordem);
// - os sons (eventos) que saem, com os args resolvidos;
// - as recusas: carimbo "pago", confete perto de "pagar", grupo inexistente, grupo em círculo, ícone que não
//   existe, canal que a camada não tem, transição antes do começo do vídeo, "de" igual a "para"; e os avisos.

import { KIT, argSaida, empacota, gravaRelatorio, lerJson, pluginCalcos } from "./comum.mjs";
import path from "node:path";

const ENTRADA = `
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
export { gsap, CustomEase };
export { registraEases, novaTimeline } from "../../nucleo/eases";
export { novoEstado } from "../../nucleo/estado";
export { montaTimeline } from "../../nucleo/monta";
export * as ext from "./batidas";
export * as cortes from "./cortes";
export { spring, shake, inn } from "../../../motion/kit";
export { outCubic } from "../../../lib/tl";
`;

const m = (await empacota(ENTRADA, { nome: "batidas-k14.tsx", plugins: [pluginCalcos] })).modulo;
const { gsap, CustomEase, registraEases, novaTimeline, novoEstado, montaTimeline, ext, cortes, spring, shake, inn, outCubic } = m;
gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep();
registraEases(gsap, CustomEase);

const narr = lerJson(path.join(KIT, "pecas", "guia-pronta-2026-10-14", "voz", "narracao.json"));

function propsDe(camadas, batidas) {
  return {
    versao: 1, peca: "teste-k14", titulo: "Teste da biblioteca 2D", publicDir: "public-kit", fps: 30, largura: 1080, altura: 1920,
    duracao: 18, quadros: 540, tFecho: 15,
    narracao: { fps: 30, words: narr.words, phrases: narr.phrases },
    voz: { arquivo: "voz/narr-dylan.wav", fecho: "embutido", final: null },
    legenda: { top: 206, altura: 330, tamanho: 68, modo: "light" },
    camera: { x: 0, y: 0.004, z: 0.66, tx: 0, ty: -0.004, tz: 0, fov: 30 },
    ambiente: { deriva: true, flutuacao: true, poeira: 0.65, periodico: false, varredura: { x: 0.11, z: 0.12, largura: 0.05, altura: 0.5, intensidade: 14, yDe: 0.28, yAte: -0.28 } },
    objetos: [], telas: {}, regioes: {},
    camadas: JSON.parse(JSON.stringify(camadas)),
    batidas: JSON.parse(JSON.stringify(batidas)),
    sons: { perfil: "v2", modoRuido: "por-evento", extras: [], remover: [] },
    fecho: null,
    trilha: { id: "mixkit-04-house-one", mStart: 51.711, ganhoDb: -6.7, transporVerificado: 0, status: "liberado", decisaoRisco: null },
    fatos: { publico: "ambos", exemplos: [] }, capa: null, creditos: [], creditoLegenda: null, avisos: [], marcas: {},
  };
}

function monta(camadas, batidas, registro = ext.batidas) {
  const props = propsDe(camadas, batidas);
  const tl = novaTimeline(gsap);
  const st = novoEstado(props);
  const erros = [];
  const avisos = [];
  const eventos = montaTimeline(tl, st, props, registro, { avisos, aoErro: (_o, e) => erros.push(e.message) });
  tl.seek(0, false);
  return { props, tl, st, erros, avisos, eventos };
}

const CAMADAS = [
  { id: "cena1", tipo: "p2d-grupo", fundo: "coral", estado: {} },
  { id: "cena2", tipo: "p2d-grupo", fundo: "paper", estado: {} },
  { id: "cena3", tipo: "p2d-grupo", fundo: "dark", estado: {} },
  { id: "num", tipo: "p2d-Numeral", grupo: "cena1", n: 1, x: 178, y: 1070, rot: -8, estado: {} },
  { id: "card", tipo: "p2d-ClayCard", grupo: "cena1", seq: "cadastro", size: 600, x: 628, y: 1170, estado: {} },
  { id: "conf", tipo: "p2d-Confetti", grupo: "cena2", x: 540, y: 1060, estado: {} },
  { id: "olho", tipo: "p2d-Eye", grupo: "cena3", estado: { open: 0 } },
  { id: "leg", tipo: "p2d-legenda", modos: ["coral", "light", "light", "dark"], estado: {} },
];
const BATIDAS = [
  { id: "p2d-entra", params: { camada: "num", t: 1.0 } },
  { id: "p2d-mola", params: { camada: "num", t: 2.0 } },
  { id: "p2d-mola", params: { camada: "num", t: 2.2 } },
  { id: "p2d-treme", params: { camada: "cena1", t: 2.5 } },
  { id: "p2d-canal", params: { camada: "card", t: 1.0, canal: "frame", de: 0, para: 120, dur: 2.5, ease: "none" } },
  { id: "p2d-sai", params: { camada: "num", t: 3.5, para: { op: 0 } } },
  { id: "p2d-transicao", params: { tipo: "push", de: "cena1", para: "cena2", t: 4.0 } },
  { id: "p2d-canal", params: { camada: "conf", t: 4.5, canal: "voo", de: 0, para: 1, dur: 1.6, ease: "none" } },
  { id: "p2d-corte", params: { tipo: "flash", de: "cena2", para: "cena3", t: 6.0 } },
  { id: "p2d-canal", params: { camada: "olho", t: 6.3, canal: "open", de: 0, para: 1, dur: 0.2, ease: "power2.out" } },
];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** só os números de cada canal (o GSAP pendura um _gsap em cada objeto que anima) */
const foto = (canais) => {
  const o = {};
  for (const id of Object.keys(canais).sort()) {
    o[id] = {};
    for (const k of Object.keys(canais[id]).sort()) if (typeof canais[id][k] === "number") o[id][k] = canais[id][k];
  }
  return JSON.stringify(o);
};
const rel = { versao: 1, geradoEm: new Date().toISOString(), quadros: 540, canais: {}, ordem: null, eventos: null, recusas: [], avisos: null };
const dif = {};
const anota = (nome, a, b) => {
  const d = Math.abs(a - b);
  if (!dif[nome] || d > dif[nome].max) dif[nome] = { max: d, q: dif[nome] ? dif[nome].q : 0 };
  dif[nome].q++;
};

const A = monta(CAMADAS, BATIDAS);
if (A.erros.length) {
  console.log("ERRO na cena de teste:\n- " + A.erros.join("\n- "));
  process.exit(1);
}
const c = A.st.canais;
const DMOLA = Math.log(1000) / 6.5;
const estados = [];
for (let q = 0; q < 540; q++) {
  const t = q / 30;
  const T = t + 1e-4; // o seek do render
  A.tl.seek(T, false);
  estados.push(foto(c));
  // entrada (inn) e saída (leave: 1 - outCubic)
  const e = inn(T, 1.0, 0.34, 0.4, 1.8);
  anota("p2d-entra s (contra inn.sc)", c.num.s, e.sc);
  const opEsperado = T < 3.5 ? e.al : (1 - outCubic((T - 3.5) / 0.26));
  anota("p2d-entra e p2d-sai op (inn.al, depois 1 - outCubic)", c.num.op, opEsperado);
  // molas somadas em canais próprios
  anota("p2d-mola s~1 (contra spring 2,0)", c.num["s~1"], T < 2.0 + DMOLA ? spring(T, 2.0, 0.1, 2.6, 6.5) : 0);
  anota("p2d-mola s~2 (contra spring 2,2)", c.num["s~2"], T < 2.2 + DMOLA ? spring(T, 2.2, 0.1, 2.6, 6.5) : 0);
  // tremida
  anota("p2d-treme x~1 (contra shake 14/0)", c.cena1["x~1"], T < 3.1 ? shake(T, 2.5, 14, 0) : 0);
  anota("p2d-treme y~1 (contra shake 9,8/1)", c.cena1["y~1"], T < 3.1 ? shake(T, 2.5, 9.8, 1) : 0);
  // canais lineares
  anota("p2d-canal frame (linear 0 a 120)", c.card.frame, 120 * clamp01((T - 1.0) / 2.5));
  anota("p2d-canal voo (linear 0 a 1)", c.conf.voo, clamp01((T - 4.5) / 1.6));
  // transição push em 4,0 (d 0,44): janela [3,78, 4,22]
  const ini = 4.0 - 0.22;
  const fim = 4.0 + 0.22;
  anota("p2d-transicao vis da que entra", c.cena2.vis, T >= ini && T < 6.0 ? 1 : 0);
  anota("p2d-transicao vis da que sai", c.cena1.vis, T < fim ? 1 : 0);
  if (T >= ini) {
    anota("p2d-transicao entra (progresso)", c.cena2.entra, clamp01((T - ini) / 0.44));
    anota("p2d-transicao sai (progresso)", c.cena1.sai, clamp01((T - ini) / 0.44));
    anota("p2d-transicao tipo (push = 1)", c.cena2.entraTipo + c.cena1.saiTipo, 2);
  }
  // flash em 6,0: troca seca e clarão (o da que sai antes da borda, o da que entra depois)
  anota("p2d-corte vis da que entra (flash)", c.cena3.vis, T >= 6.0 ? 1 : 0);
  const claraoVisivel = (c.cena2.vis >= 0.5 ? c.cena2.clarao : 0) + (c.cena3.vis >= 0.5 ? c.cena3.clarao : 0);
  anota("p2d-corte clarão visível (contra o Broll)", claraoVisivel, cortes.claraoT(T, [6.0]));
}
const TOL = { padrao: 1e-6, frame: 1e-4, px: 1e-3 };
let ok = true;
for (const k of Object.keys(dif)) {
  // o GSAP arredonda o valor a 6 casas e o tempo a 7: tolerância de 1e-6 nos canais de 0 a 1, de 1e-4 no frame
  // (0 a 120) e de 1e-3 px na tremida
  const tol = /treme/.test(k) ? TOL.px : /frame/.test(k) ? TOL.frame : TOL.padrao;
  const passou = dif[k].max <= tol;
  ok = ok && passou;
  rel.canais[k] = { quadros: dif[k].q, difMax: dif[k].max, tolerancia: tol, passou };
}

// a mesma cena com as batidas em ordem invertida: estado igual em todos os quadros
{
  const B = monta(CAMADAS, BATIDAS.slice().reverse());
  let diferentes = 0;
  for (let q = 0; q < 540; q++) {
    B.tl.seek(q / 30 + 1e-4, false);
    // os canais "~n" trocam de número com a ordem: compara a soma de cada base
    const norm = (s) => {
      const o = JSON.parse(s);
      for (const id of Object.keys(o)) {
        const somas = {};
        for (const k of Object.keys(o[id])) {
          const mm = /^(x|y|s|rot)~\d+$/.exec(k);
          if (mm) {
            somas[mm[1]] = (somas[mm[1]] || 0) + o[id][k];
            delete o[id][k];
          }
        }
        for (const b of Object.keys(somas)) o[id][`${b}~soma`] = Math.round(somas[b] * 1e12) / 1e12;
      }
      return JSON.stringify(o, Object.keys(o).sort());
    };
    if (norm(estados[q]) !== norm(foto(B.st.canais))) diferentes++;
  }
  rel.ordem = { quadros: 540, diferentes, passou: diferentes === 0 };
  ok = ok && diferentes === 0;
}

// sons
{
  const ev = A.eventos.map((e) => ({ t: e.t, som: e.som, args: e.args || null, ganhoDb: e.ganhoDb, origem: e.origem }));
  const esperado = [
    { t: 1.0, som: "sint-s_pop", args: [620, 240, 0.16, 22], ganhoDb: -25 },
    { t: 2.5, som: "sint-s_thump", args: [130, 55, 0.3], ganhoDb: -21 },
    { t: 3.7, som: "sint-s_whoosh", args: [0.64, 400, 6000], ganhoDb: -27 },
    { t: 6.0, som: "sint-s_thump", args: [150, 60, 0.28], ganhoDb: -24 },
    { t: 6.0, som: "sint-s_tick", args: [2200], ganhoDb: -30 },
  ];
  const iguais = ev.length === esperado.length && esperado.every((x, i) => Math.abs(ev[i].t - x.t) < 1e-6 && ev[i].som === x.som && JSON.stringify(ev[i].args) === JSON.stringify(x.args) && ev[i].ganhoDb === x.ganhoDb);
  rel.eventos = { saiu: ev, esperado, passou: iguais };
  ok = ok && iguais;
}

// recusas e avisos
const recusas = [
  ["carimbo com \"PAGO\"", [{ id: "s", tipo: "p2d-Stamp", text: "PAGO", estado: {} }], [{ id: "p2d-entra", params: { camada: "s", t: 1 } }], /pago/],
  ["confete perto de \"pagar\"", [{ id: "cf", tipo: "p2d-Confetti", estado: {} }], [{ id: "p2d-canal", params: { camada: "cf", t: 10.2, canal: "voo", de: 0, para: 1, dur: 1.6, ease: "none" } }], /confete nunca na batida de pagar/],
  ["grupo inexistente", [{ id: "a", tipo: "p2d-Pill", texto: "x", grupo: "nada", estado: {} }], [{ id: "p2d-entra", params: { camada: "a", t: 1 } }], /não existe ou não é p2d-grupo/],
  ["grupos em círculo", [{ id: "g1", tipo: "p2d-grupo", grupo: "g2", estado: {} }, { id: "g2", tipo: "p2d-grupo", grupo: "g1", estado: {} }], [{ id: "p2d-entra", params: { camada: "g1", t: 1 } }], /círculo/],
  ["ícone que não existe", [{ id: "st", tipo: "p2d-Sticker", icon: "foguete", estado: {} }], [{ id: "p2d-entra", params: { camada: "st", t: 1 } }], /ícone/],
  ["canal que a camada não tem", [{ id: "n", tipo: "p2d-Numeral", n: 2, estado: {} }], [{ id: "p2d-canal", params: { camada: "n", t: 1, canal: "frame", para: 3 } }], /não tem o canal/],
  ["transição antes do começo", [{ id: "g1", tipo: "p2d-grupo", estado: {} }, { id: "g2", tipo: "p2d-grupo", estado: {} }], [{ id: "p2d-transicao", params: { tipo: "iris", de: "g1", para: "g2", t: 0.1 } }], /fora do vídeo/],
  ["\"de\" igual a \"para\"", [{ id: "g1", tipo: "p2d-grupo", estado: {} }], [{ id: "p2d-corte", params: { tipo: "whipL", de: "g1", para: "g1", t: 3 } }], /mesmo grupo/],
  ["tipo de transição desconhecido", [{ id: "g1", tipo: "p2d-grupo", estado: {} }, { id: "g2", tipo: "p2d-grupo", estado: {} }], [{ id: "p2d-transicao", params: { tipo: "fade", de: "g1", para: "g2", t: 3 } }], /desconhecido/],
];
for (const [rotulo, cam, bat, re] of recusas) {
  const r = monta(cam, bat);
  const passou = r.erros.length > 0 && r.erros.some((e) => re.test(e));
  rel.recusas.push({ caso: rotulo, erros: r.erros, passou });
  ok = ok && passou;
  r.tl.kill();
}
{
  const r = monta(
    [
      { id: "teto", tipo: "p2d-TetoCard", estado: {} },
      { id: "cel", tipo: "p2d-Phone", estado: {} },
      { id: "o1", tipo: "p2d-Eye", estado: {} },
      { id: "o2", tipo: "p2d-Eye", estado: {} },
      { id: "nn", tipo: "p2d-Numeral", n: 178, estado: {} },
    ],
    [{ id: "p2d-entra", params: { camada: "teto", t: 1 } }],
  );
  const esperados = [/TETO DO MEI/, /splash do protótipo/, /recortar errado/, /ext-liga precificacao/, /FATOS/];
  const achados = esperados.map((re) => r.avisos.some((a) => re.test(a)));
  rel.avisos = { avisos: r.avisos, passou: achados.every(Boolean) && r.erros.length === 0 };
  ok = ok && rel.avisos.passou;
  r.tl.kill();
}

A.tl.kill();
gsap.ticker.sleep();
rel.passou = ok;
for (const k of Object.keys(rel.canais)) {
  const r = rel.canais[k];
  console.log(`${r.passou ? "ok   " : "FALHA"} ${k}: ${r.quadros} quadros, diferença máxima ${r.difMax.toExponential(2)} (tolerância ${r.tolerancia})`);
}
console.log(`${rel.ordem.passou ? "ok   " : "FALHA"} batidas em ordem invertida: ${rel.ordem.diferentes} quadros diferentes de 540`);
console.log(`${rel.eventos.passou ? "ok   " : "FALHA"} sons: ${rel.eventos.saiu.length} eventos: ${rel.eventos.saiu.map((e) => `${e.som}@${e.t}${e.args ? JSON.stringify(e.args) : ""}`).join("; ")}`);
for (const r of rel.recusas) console.log(`${r.passou ? "ok   " : "FALHA"} recusa: ${r.caso}: ${r.erros[0] || "(nenhum erro)"}`);
console.log(`${rel.avisos.passou ? "ok   " : "FALHA"} avisos: ${rel.avisos.avisos.length}`);
for (const a of rel.avisos.avisos) console.log(`      ${a}`);
console.log(ok ? "\nRESULTADO: as batidas passaram" : "\nRESULTADO: FALHOU");
const saida = argSaida(process.argv);
if (saida) {
  const g = await gravaRelatorio(saida, rel);
  console.log(`relatório: ${g.caminho} (${g.tamanho} bytes)`);
}
process.exit(ok ? 0 : 1);
