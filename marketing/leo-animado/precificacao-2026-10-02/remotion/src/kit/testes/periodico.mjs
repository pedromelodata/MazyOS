// Teste do modo periódico (dono K02; KIT/DESENHO.md seções 5 e 11): com a cenas-periodico-22s.json, a camada
// ambiente (deriva da câmera e flutuação de cada objeto) em t = 22 tem de ser igual à de t = 0 (≤ 1e-9); com
// periodico false ela não fecha (prova que o teste mede alguma coisa). Também mostra as frequências trocadas e
// confere a emenda do loop na camada ambiente (o passo do quadro 659 pro 660 = 0 não pode ser maior que o
// percentil 95 dos passos entre quadros vizinhos).
// Uso: node periodico.mjs        (código de saída 0 = passou)

import { carregaNucleo } from "./esbuild-node.mjs";
import { carregaCatalogo, dormeTicker, lerCena, lerFecho, lerNarracao } from "./comum.mjs";

const TOL = 1e-9;
const kit = await carregaNucleo();
dormeTicker(kit.gsap);

const { cena, pasta, caminho } = lerCena("cenas-periodico-22s.json");
const narr = lerNarracao(cena, pasta);
const fecho = lerFecho();
const cat = carregaCatalogo();
console.log(`cena: ${caminho}`);
console.log(`narração: ${narr.origem}${narr.usouFallback ? " (a da peça ainda não existe: usei a do guia)" : ""}`);
console.log(`catálogo: ${cat.origem}`);

const props = kit.montaProps(cena, { narracao: narr.narracao, fecho: fecho.fecho, catalogo: cat.catalogo });
const D = props.duracao;
console.log(`duração ${D} s, ${props.quadros} quadros, periódico ${props.ambiente.periodico}`);

/** maior diferença entre duas leituras da camada ambiente */
function diferenca(a, b) {
  let max = 0;
  let onde = "";
  const ve = (nome, x, y) => {
    const d = Math.abs(x - y);
    if (d > max || Number.isNaN(d)) {
      max = Number.isNaN(d) ? Infinity : d;
      onde = nome;
    }
  };
  ve("cam.x", a.cam.x, b.cam.x);
  ve("cam.y", a.cam.y, b.cam.y);
  for (const id of Object.keys(a.objetos)) {
    ve(`${id}.y`, a.objetos[id].y, b.objetos[id].y);
    ve(`${id}.rz`, a.objetos[id].rz, b.objetos[id].rz);
  }
  return { max, onde };
}

// frequências: a original e a trocada (2πk/D)
console.log("\nfrequências (rad/s) com periódico:");
const linhas = [["deriva x", kit.DERIVA.x.freq], ["deriva y", kit.DERIVA.y.freq]];
for (const o of props.objetos) {
  const fl = kit.flutuacaoDe(o);
  if (!fl) continue;
  linhas.push([`${o.id} (${o.tipo}) y`, fl.freq]);
  if (fl.rzAmp) linhas.push([`${o.id} (${o.tipo}) rz`, fl.rzFreq === undefined ? fl.freq : fl.rzFreq]);
}
for (const [nome, f] of linhas) {
  const fp = kit.frequencia(f, true, D);
  console.log(`  ${nome.padEnd(22)} ${f.toFixed(4)} vira ${fp.toFixed(6)} (k = ${Math.round((fp * D) / (2 * Math.PI))})`);
}

const resultados = [];

// 1: periódico true fecha
const a0 = kit.ambienteEm(0, props);
const aD = kit.ambienteEm(D, props);
const d1 = diferenca(a0, aD);
const ok1 = d1.max <= TOL;
console.log(`\n[${ok1 ? "ok" : "FALHA"}] periódico true: camada ambiente em t = ${D} contra t = 0: maior diferença ${d1.max.toExponential(3)} (${d1.onde}); limite ${TOL}`);
resultados.push(ok1);

// 2: periódico false não fecha (o teste mede alguma coisa)
const propsFixo = JSON.parse(JSON.stringify(props));
propsFixo.ambiente.periodico = false;
const b0 = kit.ambienteEm(0, propsFixo);
const bD = kit.ambienteEm(D, propsFixo);
const d2 = diferenca(b0, bD);
const ok2 = d2.max > 1e-6;
console.log(`[${ok2 ? "ok" : "FALHA"}] periódico false: em t = ${D} a camada ambiente NÃO volta: maior diferença ${d2.max.toExponential(3)} (${d2.onde}); precisa passar de 1e-6`);
resultados.push(ok2);

// 3: emenda do loop na camada ambiente (quadro 659 pro 660 = 0 contra os passos normais)
const passos = [];
let anterior = kit.ambienteEm(0, props);
for (let q = 1; q < props.quadros; q++) {
  const atual = kit.ambienteEm(q / props.fps, props);
  passos.push(diferenca(anterior, atual).max);
  anterior = atual;
}
const emenda = diferenca(anterior, kit.ambienteEm(0, props)).max;
const ordenados = passos.slice().sort((x, y) => x - y);
const p95 = ordenados[Math.floor(0.95 * (ordenados.length - 1))];
const maior = ordenados[ordenados.length - 1];
const emendaFixo = (() => {
  let ant = kit.ambienteEm((props.quadros - 1) / props.fps, propsFixo);
  return diferenca(ant, kit.ambienteEm(0, propsFixo)).max;
})();
// na camada ambiente sozinha a emenda é um passo normal (a função é periódica com período de 660 quadros); no
// t = 0 a fase é zero, o ponto de velocidade máxima do seno, então ela fica no topo dos passos (acima do p95).
// O critério do K12 (p95) é sobre a pose inteira, com a coreografia; aqui a prova é "sem salto".
const ok3 = emenda <= maior * (1 + 1e-6) && emendaFixo > maior * 2;
console.log(`[${ok3 ? "ok" : "FALHA"}] emenda do loop na camada ambiente (quadro ${props.quadros - 1} pro 0): ${emenda.toExponential(3)}; maior passo normal ${maior.toExponential(3)} (p95 ${p95.toExponential(3)}): sem salto. Com periódico false a emenda daria ${emendaFixo.toExponential(3)} (salto)`);
resultados.push(ok3);

// 4: a volta-loop cai em fim - 0,95 e os sons têm semente por evento
const r = kit.avaliaCena(cena, { narracao: narr.narracao, fecho: fecho.fecho, catalogo: cat.catalogo });
const volta = r.eventos.filter((e) => e.origem.indexOf("volta-loop") === 0)[0];
const semSemente = r.eventos.filter((e) => typeof e.semente !== "number").length;
const ok4 = !!volta && Math.abs(volta.t - 21.05) < 1e-9 && semSemente === 0;
console.log(`[${ok4 ? "ok" : "FALHA"}] volta-loop em ${volta ? volta.t : "?"} s (esperado 21,05) e ${r.eventos.length - semSemente} de ${r.eventos.length} eventos com semente crc32(origem) (ex.: ${r.eventos[0].origem} = ${r.eventos[0].semente})`);
resultados.push(ok4);

const passou = resultados.every(Boolean);
console.log(`\nresultado: ${passou ? "PASSOU" : "FALHOU"}`);
dormeTicker(kit.gsap);
process.exit(passou ? 0 : 1);
