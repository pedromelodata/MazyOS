// Caixa de cada forma de argila (em metros, no espaço do modelo, origem no meio da base), pelos vértices das malhas
// visíveis, como o KitProvaModelo mede (caixaDoObjeto). Roda em Node com um calço de canvas (as texturas pintadas
// não mudam a geometria). Uso: node caixas_argila.mjs <saida.json>
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { RM, EXT } from "./resolve.mjs";

const esbuild = createRequire(path.join(RM, "package.json"))("esbuild");
const barra = (p) => p.split(path.sep).join("/");

// calço de DOM: canvas que aceita qualquer desenho
const ctx2d = new Proxy({}, {
  get(_a, k) {
    if (k === "measureText") return () => ({ width: 10 });
    if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
    if (k === "getImageData") return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
    return () => undefined;
  },
  set() { return true; },
});
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, style: {} }),
  fonts: { forEach() {}, load: async () => [], ready: Promise.resolve() },
};
globalThis.window = globalThis;
globalThis.self = globalThis;

const entrada = `
import * as THREE from "three";
import { montaArgila, FORMAS_ARGILA } from "${barra(path.join(EXT, "comum", "objetos", "argila.ts"))}";
export { THREE, montaArgila, FORMAS_ARGILA };
`;
const r = await esbuild.build({
  bundle: true, write: false, platform: "node", format: "esm", target: "node20", absWorkingDir: RM, logLevel: "silent",
  nodePaths: [path.join(RM, "node_modules")], jsx: "automatic",
  stdin: { contents: entrada, resolveDir: path.join(RM, "src", "kit"), sourcefile: "caixas-entrada.ts", loader: "ts" },
});
const M = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text, "utf8").toString("base64"));
const { THREE } = M;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const opcoes = {
  pilha: { macos: [0.013, 0.012, 0.014, 0.012], semente: 11 },
  pasta: { folhas: 3, docFrente: true },
  despertador: { tamanho: 0.062 },
};
const out = {};
for (const forma of M.FORMAS_ARGILA) {
  const m = M.montaArgila(forma, opcoes[forma] || {});
  const raiz = new THREE.Group();
  raiz.add(m.modelo);
  m.pinta({}, 0);
  raiz.updateWorldMatrix(true, true);
  const caixa = new THREE.Box3();
  const v = new THREE.Vector3();
  const visivel = (o) => (o ? o.visible && !o.userData.ignoraCaixa && visivel(o.parent) : true);
  let tri = 0;
  raiz.traverse((o) => {
    if (!o.isMesh || !visivel(o)) return;
    const pos = o.geometry.getAttribute("position");
    if (!pos) return;
    tri += o.geometry.index ? o.geometry.index.count / 3 : pos.count / 3;
    for (let i = 0; i < pos.count; i++) caixa.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  const min = [r6(caixa.min.x), r6(caixa.min.y), r6(caixa.min.z)];
  const max = [r6(caixa.max.x), r6(caixa.max.y), r6(caixa.max.z)];
  const tam = [r6(max[0] - min[0]), r6(max[1] - min[1]), r6(max[2] - min[2])];
  out[forma] = { min, max, tamanho: tam, triangulos: Math.round(tri), sHeroi: r6(0.16 / Math.max(...tam)), opcoes: opcoes[forma] || {} };
  console.log(forma.padEnd(16), "tamanho", tam.map((x) => (x * 100).toFixed(1) + " cm").join(" x "), "min", min, "sHeroi", out[forma].sHeroi, "tri", Math.round(tri));
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1) + "\n", "utf8");
process.exit(0);
