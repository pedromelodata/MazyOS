// Empacota uma entrada TypeScript em memória com o esbuild do RM/node_modules e importa por data URL
// (contrato: KIT/DESENHO.md, seção 4.11; dono K02). Nada é gravado no disco.
// bundle true, platform node, format esm, tudo embutido (gsap e three entram no pacote).
// O plugin "calço" troca '../abertura/useMasterTimeline' (que puxa React, Remotion, SplitText e DrawSVGPlugin)
// por um módulo que só registra as três eases da marca, com os mesmos caminhos.
// O plugin "puro" recusa React, Remotion, SplitText e DrawSVGPlugin no pacote (prova que o núcleo é puro).

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RM = path.resolve(AQUI, "../../..");
export const KIT = path.resolve(RM, "../../_kit-motion");

const requireRM = createRequire(path.join(RM, "package.json"));
export const esbuild = requireRM("esbuild");

export const CALCO_EASES = `
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
CustomEase.create("lgEntra", "M0,0 C0.18,0.9 0.32,1.12 0.56,1.06 0.74,1.01 0.86,1 1,1");
CustomEase.create("lgSai", "M0,0 C0.4,0 0.7,0.25 1,1");
CustomEase.create("lgPousa", "M0,0 C0.12,0.7 0.24,1.18 0.42,1.1 0.6,0.98 0.78,1.02 1,1");
export { gsap };
export function useMasterTimeline() {
  throw new Error("calço do K02: useMasterTimeline não existe em Node (só as eases foram registradas)");
}
`;

export const pluginCalco = {
  name: "calco-useMasterTimeline",
  setup(build) {
    build.onResolve({ filter: /(^|[\\/])useMasterTimeline(\.tsx?)?$/ }, () => ({ path: "calco-useMasterTimeline", namespace: "calco-k02" }));
    build.onLoad({ filter: /.*/, namespace: "calco-k02" }, () => ({ contents: CALCO_EASES, loader: "js", resolveDir: RM }));
  },
};

const PROIBIDOS = /^(react|react-dom|remotion|@remotion\/.*|@react-three\/.*|gsap\/(SplitText|DrawSVGPlugin)(\.js)?)$/;

export const pluginPuro = {
  name: "nucleo-puro",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (PROIBIDOS.test(args.path)) {
        return { errors: [{ text: `import proibido no núcleo do kit: "${args.path}" (em ${args.importer || "entrada"})` }] };
      }
      return undefined;
    });
  },
};

/**
 * Empacota e importa. Passe `entrada` (arquivo) ou `conteudo` (texto TS, resolvido a partir de `resolveDir`).
 * Devolve { modulo, bytes, avisos }.
 */
export async function empacota({ entrada, conteudo, resolveDir = AQUI, nome = "entrada-k02.ts", calco = true, puro = true } = {}) {
  const plugins = [];
  if (puro) plugins.push(pluginPuro);
  if (calco) plugins.push(pluginCalco);
  const base = {
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    target: "node20",
    absWorkingDir: RM,
    logLevel: "silent",
    plugins,
  };
  const r = await esbuild.build(
    conteudo !== undefined
      ? { ...base, stdin: { contents: conteudo, resolveDir, sourcefile: nome, loader: "ts" } }
      : { ...base, entryPoints: [entrada] },
  );
  const codigo = r.outputFiles[0].text;
  const modulo = await import("data:text/javascript;base64," + Buffer.from(codigo, "utf8").toString("base64"));
  return { modulo, bytes: codigo.length, avisos: r.warnings };
}

/** a entrada do núcleo inteiro (tipos, eases, tempo, estado, pose, projeção, sons, monta, props e batidas) */
export const ENTRADA_NUCLEO = `
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
export { gsap, CustomEase };
export * from "../nucleo/eases";
export * from "../nucleo/tempo";
export * from "../nucleo/estado";
export * from "../nucleo/pose";
export * from "../nucleo/projecao";
export * from "../nucleo/sons";
export * from "../nucleo/monta";
export * from "../nucleo/props";
export * from "../batidas/index";
`;

/** a entrada da coreografia original do guia (com o calço no lugar do useMasterTimeline) */
export const ENTRADA_ORIGINAL = `
import gsap from "gsap";
export { gsap };
export { coreografia } from "../../guia/coreografia";
export { novoEstado, CAM0, POSE0, W, FPS, DUR, FRAMES } from "../../guia/estado";
`;

export async function carregaNucleo() {
  return (await empacota({ conteudo: ENTRADA_NUCLEO, nome: "nucleo-k02.ts" })).modulo;
}

export async function carregaOriginal() {
  return (await empacota({ conteudo: ENTRADA_ORIGINAL, nome: "original-guia.ts" })).modulo;
}

// uso direto: node esbuild-node.mjs  (empacota os dois e mostra o tamanho)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const a = await empacota({ conteudo: ENTRADA_NUCLEO, nome: "nucleo-k02.ts" });
  const b = await empacota({ conteudo: ENTRADA_ORIGINAL, nome: "original-guia.ts" });
  console.log(`núcleo: ${a.bytes} bytes, ${Object.keys(a.modulo).length} exportações`);
  console.log(`original: ${b.bytes} bytes, ${Object.keys(b.modulo).length} exportações`);
  a.modulo.gsap.ticker.sleep();
  b.modulo.gsap.ticker.sleep();
  process.exit(0);
}
