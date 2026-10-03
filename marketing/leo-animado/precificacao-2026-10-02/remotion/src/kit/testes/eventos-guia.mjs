// Eventos de som da cena do guia contra a tabela-mestra da seção 6 do KIT/DESENHO.md (dono K02).
// Compara item por item: ordem, t com 6 casas, som, args, ganho, filtro e inverte (transpor 0 conta como ausente).
// Se o K05 já gravou KIT/audio/_regressao/eventos-guia-v2.json, compara com ele também.
// Uso: node eventos-guia.mjs [cena.json] [--saida <eventos.json>]   (a saída é opcional e passa pelo escrita.mjs)

import fs from "node:fs";
import path from "node:path";
import { carregaNucleo } from "./esbuild-node.mjs";
import { KIT, carregaCatalogo, dormeTicker, lerCena, lerFecho, lerJson, lerNarracao, lerRegioes } from "./comum.mjs";
import { gravaJson } from "../lib/escrita.mjs";

// [ordem, t, som, args, ganho, inverte, batida de origem] (seção 6, perfil v2, modo legado)
export const TABELA_SECAO_6 = [
  [0, 0.0, "sint-s_whoosh", [0.5, 400, 6000], -32, false, "gancho-giro-varredura"],
  [1, 0.82, "sint-s_brilho", [0.75], -38, false, "gancho-giro-varredura"],
  [2, 1.84, "sint-s_swish", [0.13], -37, false, "nao-de-cabeca"],
  [3, 2.0, "sint-s_swish", [0.13], -38, false, "nao-de-cabeca"],
  [4, 2.16, "sint-s_swish", [0.13], -39, false, "nao-de-cabeca"],
  [5, 3.52, "pixabay-405445", [], -26, false, "mergulho-abre-app"],
  [6, 3.72, "pixabay-197886", [], -29, false, "mergulho-abre-app"],
  [7, 4.24, "sint-s_chime", [1975.5, 0.6], -35, false, "card-contador"],
  [8, 4.3, "sint-s_processa", [4.3, 5.5], 0, false, "card-contador"],
  [9, 5.66, "pixabay-186577", [], -30, false, "empurrar-tela"],
  [10, 6.12, "sint-s_whoosh", [0.45, 400, 7000], -29, false, "objeto-sai-da-tela"],
  [11, 6.18, "sint-s_papel", [0.3], -30, false, "objeto-sai-da-tela"],
  [12, 7.22, "sint-s_papel", [0.22], -33, false, "objeto-sai-da-tela"],
  [13, 7.76, "sint-s_swish", [0.3], -32, false, "objeto-sai-da-tela"],
  [14, 7.76, "pixabay-405445", [], -29, false, "objeto-sai-da-tela"],
  [15, 8.04, "sint-s_vibra", [0.16], -25, false, "relogio-notificacao"],
  [16, 8.22, "sint-s_vibra", [0.18], -26, false, "relogio-notificacao"],
  [17, 8.07, "pixabay-570438", [], -25, false, "relogio-notificacao"],
  [18, 8.93, "sint-s_swish", [0.28], -32, false, "relogio-notificacao"],
  [19, 8.88, "mixkit-166", [], -27, false, "flip-troca-escondida"],
  [20, 9.7, "mixkit-1897", [], -36, false, "flip-troca-escondida"],
  [21, 9.62, "sint-s_whoosh", [0.5, 500, 7000], -33, false, "flip-troca-escondida"],
  [22, 10.12, "sint-s_tick", [2900], -38, false, "toque-botao"],
  [23, 10.29, "mixkit-1109", [], -22, false, "toque-botao"],
  [24, 10.42, "mixkit-2867", [], -26, false, "toque-botao"],
  [25, 10.95, "sint-s_whoosh", [0.55, 350, 6000], -33, false, "recuo-camera"],
  [26, 11.74, "sint-s_brilho", [0.7], -36, false, "recuo-camera"],
  [27, 13.45, "sint-s_whoosh", [0.45, 400, 6500], -32, false, "fecho-simbolo"],
  [28, 14.58, "sint-s_whoosh", [0.45, 400, 7000], -31, true, "fecho-simbolo"],
  [29, 14.97, "sint-s_pop", [900, 420, 0.1, 34], -29, false, "fecho-simbolo"],
  [30, 15.96, "sint-s_chime", [1567.98, 0.9], -33, false, "fecho-simbolo"],
  [31, 16.0, "sint-s_chime", [2093.0, 0.7], -39, false, "fecho-simbolo"],
  [32, 16.95, "sint-s_swish", [0.3], -33, false, "fecho-simbolo"],
  [33, 15.3, "pixabay-316482", [], -28, false, "link-bio"],
  [34, 17.05, "sint-s_whoosh", [0.6, 300, 5000], -33, false, "volta-loop"],
];

const r6 = (x) => Math.round(x * 1e6) / 1e6;
const mesmoArgs = (a, b) => a.length === b.length && a.every((v, i) => (typeof v === "number" && typeof b[i] === "number" ? Math.abs(v - b[i]) < 1e-9 : v === b[i]));

/** compara uma lista de eventos com a tabela; devolve a lista de diferenças */
export function comparaComTabela(eventos, tabela = TABELA_SECAO_6) {
  const dif = [];
  if (eventos.length !== tabela.length) dif.push(`quantidade: ${eventos.length} eventos contra ${tabela.length} na tabela`);
  const n = Math.min(eventos.length, tabela.length);
  for (let i = 0; i < n; i++) {
    const ev = eventos[i];
    const [ordem, t, som, args, ganho, inverte, origem] = tabela[i];
    const tr = ev.transpor === undefined || ev.transpor === 0 ? undefined : ev.transpor;
    const erros = [];
    if (ev.ordem !== ordem) erros.push(`ordem ${ev.ordem} (tabela ${ordem})`);
    if (r6(ev.t) !== r6(t)) erros.push(`t ${ev.t} (tabela ${t})`);
    if (ev.som !== som) erros.push(`som ${ev.som} (tabela ${som})`);
    if (!mesmoArgs(ev.args || [], args)) erros.push(`args ${JSON.stringify(ev.args || [])} (tabela ${JSON.stringify(args)})`);
    if (ev.ganhoDb !== ganho) erros.push(`ganho ${ev.ganhoDb} (tabela ${ganho})`);
    if (!!ev.inverte !== inverte) erros.push(`inverte ${!!ev.inverte} (tabela ${inverte})`);
    if (ev.filtro) erros.push(`filtro ${ev.filtro} (tabela nenhum)`);
    if (tr !== undefined) erros.push(`transpor ${tr} (tabela nenhum)`);
    if (String(ev.origem).split("#")[0] !== origem) erros.push(`origem ${ev.origem} (tabela ${origem})`);
    if (erros.length) dif.push(`evento ${i}: ${erros.join("; ")}`);
  }
  return dif;
}

const args = process.argv.slice(2);
const iSaida = args.indexOf("--saida");
const saida = iSaida >= 0 ? args[iSaida + 1] : null;
const nomeCena = args.filter((a, i) => a !== "--saida" && i !== iSaida + 1)[0] || "cenas.json";

const kit = await carregaNucleo();
dormeTicker(kit.gsap);
const { cena, pasta, caminho } = lerCena(nomeCena);
const narr = lerNarracao(cena, pasta);
const reg = lerRegioes(cena, pasta);
const fecho = lerFecho();
const cat = carregaCatalogo();
console.log(`cena: ${caminho}`);
console.log(`narração: ${narr.origem}${narr.usouFallback ? " (a da peça ainda não existe)" : ""}`);
console.log(`catálogo: ${cat.origem}`);

const r = kit.avaliaCena(cena, { narracao: narr.narracao, regioes: reg.regioes, fecho: fecho.fecho, catalogo: cat.catalogo });
if (r.erros.length) {
  console.log(`\nFALHA: a cena tem ${r.erros.length} erro(s):\n- ${r.erros.join("\n- ")}`);
  dormeTicker(kit.gsap);
  process.exit(1);
}
const eventos = r.eventos;
console.log(`\n${eventos.length} eventos (perfil ${r.props.sons.perfil}, modo ${r.props.sons.modoRuido}):`);
for (const ev of eventos) {
  const extra = [ev.args ? `[${ev.args.join(", ")}]` : "", ev.inverte ? "inverte" : "", ev.filtro ? `filtro ${ev.filtro}` : "", ev.transpor ? `transpor ${ev.transpor}` : "", ev.semente !== undefined ? `semente ${ev.semente}` : ""]
    .filter(Boolean)
    .join(" ");
  console.log(`  ${String(ev.ordem).padStart(2)}  ${ev.t.toFixed(6).padStart(10)}  ${ev.som.padEnd(16)} ${String(ev.ganhoDb).padStart(4)} dB  ${extra.padEnd(34)} ${ev.origem}`);
}

const dif = comparaComTabela(eventos);
const okTabela = dif.length === 0;
console.log(`\n[${okTabela ? "ok" : "FALHA"}] tabela da seção 6: ${okTabela ? "35 eventos idênticos (ordem, t em 6 casas, som, args, ganho, filtro, inverte; transpor 0 = ausente)" : dif.length + " diferença(s)"}`);
for (const d of dif) console.log(`  - ${d}`);

let okFixture = true;
const fixture = path.join(KIT, "audio", "_regressao", "eventos-guia-v2.json");
if (fs.existsSync(fixture) && r.props.sons.modoRuido === "legado") {
  const fx = lerJson(fixture);
  const lista = Array.isArray(fx) ? fx : fx.eventos || [];
  const tabFx = lista.map((e, i) => [e.ordem === undefined ? i : e.ordem, e.t, e.som, e.args || [], e.ganhoDb, !!e.inverte, String(e.origem || "").split("#")[0]]);
  const difFx = comparaComTabela(eventos, tabFx).filter((d) => !/origem/.test(d) || tabFx.some((x) => x[6]));
  okFixture = difFx.length === 0;
  console.log(`[${okFixture ? "ok" : "FALHA"}] fixture do K05 (${fixture}): ${okFixture ? "igual" : difFx.length + " diferença(s)"}`);
  for (const d of difFx) console.log(`  - ${d}`);
} else {
  console.log(`(fixture do K05 ainda não existe ou a cena não é do modo legado: ${fixture})`);
}

if (saida) {
  const doc = { versao: 1, peca: r.props.peca, cena: path.basename(caminho), duracao: r.props.duracao, perfil: r.props.sons.perfil, modoRuido: r.props.sons.modoRuido, eventos };
  const g = gravaJson(path.resolve(saida), doc, { criaPasta: true });
  console.log(`gravado: ${g.caminho} (${g.tamanho} bytes)`);
}

const passou = okTabela && okFixture;
console.log(`\nresultado: ${passou ? "PASSOU" : "FALHOU"}`);
dormeTicker(kit.gsap);
process.exit(passou ? 0 : 1);
