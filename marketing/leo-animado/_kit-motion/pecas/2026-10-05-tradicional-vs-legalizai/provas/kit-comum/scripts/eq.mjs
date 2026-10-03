// Equivalência da timeline (estado inteiro, quadro a quadro, e eventos de som) entre a extensão original da peça de
// 05/10 (cópia de segurança) e o kit novo (extensão comum + extensão da peça enxuta), com as props da peça.
// Uso: node eq.mjs <props.json> <cópia-original> <rascunho> [--publicado] [--saida <json>]
//   sem --publicado: o kit novo vem do rascunho (raiz com comum/ e tradicional-vs-legalizai/);
//   com --publicado: o kit novo vem de RM/src/kit/ext (o que está no ar).
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { RM, EXT, pluginArvores } from "./resolve.mjs";

const esbuild = createRequire(path.join(RM, "package.json"))("esbuild");
const args = process.argv.slice(2);
const caminhoProps = path.resolve(args[0]);
const orig = path.resolve(args[1]);
const novo = path.resolve(args[2]);
const publicado = args.indexOf("--publicado") >= 0;
const saida = args.indexOf("--saida") >= 0 ? args[args.indexOf("--saida") + 1] : null;
const caminhoPropsB = args.indexOf("--propsB") >= 0 ? path.resolve(args[args.indexOf("--propsB") + 1]) : caminhoProps;
const barra = (p) => p.split(path.sep).join("/");
const K = barra(path.join(RM, "src", "kit"));
const baseNovo = publicado ? EXT : novo;

const entrada = `
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { registraEases, novaTimeline } from "${K}/nucleo/eases";
import { novoEstado } from "${K}/nucleo/estado";
import { montaTimeline } from "${K}/nucleo/monta";
import { BATIDAS_NUCLEO } from "${K}/batidas/index";
import { batidas as BAT_ORIG } from "${barra(path.join(orig, "tradicional-vs-legalizai", "batidas.ts"))}";
import { batidas as BAT_COMUM } from "${barra(path.join(baseNovo, "comum", "batidas.ts"))}";
import { batidas as BAT_TVL, palcos } from "${barra(path.join(baseNovo, "tradicional-vs-legalizai", "batidas.ts"))}";
export { gsap, CustomEase, registraEases, novaTimeline, novoEstado, montaTimeline, BATIDAS_NUCLEO, BAT_ORIG, BAT_COMUM, BAT_TVL, palcos };
`;
const arvores = [{ raiz: orig, nomes: ["tradicional-vs-legalizai"] }];
if (!publicado) arvores.push({ raiz: novo, nomes: ["comum", "tradicional-vs-legalizai"] });
const r = await esbuild.build({
  bundle: true, write: false, platform: "node", format: "esm", target: "node20", absWorkingDir: RM, logLevel: "silent",
  plugins: [pluginArvores(arvores)], nodePaths: [path.join(RM, "node_modules")],
  stdin: { contents: entrada, resolveDir: path.join(RM, "src", "kit"), sourcefile: "eq-entrada.ts", loader: "ts" },
});
const M = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text, "utf8").toString("base64"));
const { gsap, CustomEase } = M;
gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep();
M.registraEases(gsap, CustomEase);
const props = JSON.parse(fs.readFileSync(caminhoProps, "utf8"));
const propsB = JSON.parse(fs.readFileSync(caminhoPropsB, "utf8"));

function monta(registro, pr) {
  const tl = M.novaTimeline(gsap);
  const st = M.novoEstado(pr);
  const avisos = [];
  const erros = [];
  const ev = M.montaTimeline(tl, st, pr, registro, { avisos, aoErro: (o, e) => erros.push(`${o}: ${e.message}`) });
  tl.seek(0, false);
  return { tl, st, ev, avisos, erros };
}
const regA = { ...M.BATIDAS_NUCLEO, ...M.BAT_ORIG };
const regB = { ...M.BATIDAS_NUCLEO };
for (const k of Object.keys(M.BAT_COMUM)) regB[k] = M.BAT_COMUM[k];
for (const k of Object.keys(M.BAT_TVL)) if (!regB[k]) regB[k] = M.BAT_TVL[k];
const A = monta(regA, props);
const B = monta(regB, propsB);

/** diferenças entre dois valores (números exatos, textos, objetos com as chaves em qualquer ordem) */
function dif(a, b, cam, out) {
  if (typeof a === "number" && typeof b === "number") {
    if (!(a === b || (Number.isNaN(a) && Number.isNaN(b)))) out.push([cam, a, b]);
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)].filter((k) => k !== "_gsap"));
    for (const k of ks) {
      if (!(k in a) || !(k in b)) {
        out.push([`${cam}.${k}`, k in a ? "existe" : "falta", k in b ? "existe" : "falta"]);
        continue;
      }
      dif(a[k], b[k], `${cam}.${k}`, out);
    }
    return;
  }
  if (a !== b) out.push([cam, a, b]);
}

const res = { props: caminhoProps, propsB: caminhoPropsB, kitNovo: publicado ? "publicado (RM/src/kit/ext)" : novo, quadros: props.quadros, fps: props.fps, batidasNaCena: props.batidas.length };
res.errosOriginal = A.erros;
res.errosNovo = B.erros;
res.avisosOriginal = A.avisos;
res.avisosNovo = B.avisos;
res.avisosIguais = JSON.stringify(A.avisos) === JSON.stringify(B.avisos);
const dEv = [];
dif(A.ev, B.ev, "eventos", dEv);
res.eventos = { original: A.ev.length, novo: B.ev.length, diferencas: dEv.length, primeiras: dEv.slice(0, 5) };
let quadrosDif = 0;
let numeros = 0;
const exemplos = [];
const conta = (x) => (typeof x === "number" ? 1 : x && typeof x === "object" ? Object.keys(x).filter((k) => k !== "_gsap").reduce((s, k) => s + conta(x[k]), 0) : 0);
for (let q = 0; q <= props.quadros; q++) {
  const t = q < props.quadros ? q / props.fps : props.duracao;
  A.tl.seek(t + 1e-4, false);
  B.tl.seek(t + 1e-4, false);
  const d = [];
  dif(A.st, B.st, "st", d);
  numeros += conta(A.st);
  if (d.length) {
    quadrosDif++;
    if (exemplos.length < 8) exemplos.push({ q, n: d.length, primeiras: d.slice(0, 4) });
  }
}
res.estado = { quadrosComparados: props.quadros + 1, numerosComparados: numeros, quadrosDiferentes: quadrosDif, exemplos };
res.canais = Object.keys(B.st.canais).length;
res.palcos = M.palcos;
gsap.ticker.sleep();
console.log(JSON.stringify(res, null, 1));
if (saida) fs.writeFileSync(saida, JSON.stringify(res, null, 1) + "\n", "utf8");
process.exit(quadrosDif === 0 && dEv.length === 0 && !A.erros.length && !B.erros.length ? 0 : 1);
