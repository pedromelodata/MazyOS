// Ajudantes dos testes da extensão "precificacao" (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 4.11).
// Tudo em memória: o esbuild do RM/node_modules empacota a entrada (bundle, write false) e o módulo é importado
// por data URL. Nada é gravado no disco (o relatório, quando pedido, vai pelo RM/src/kit/lib/escrita.mjs).
//
// Plugins:
// - exporta: acrescenta "export { ... }" dos nomes internos ao TEXTO do Motion.tsx e do Broll.tsx, só na memória
//   (o arquivo em disco não muda);
// - calcos: troca "remotion", "@remotion/media" e "@remotion/fonts" por um calço mínimo (AbsoluteFill e Img como
//   componentes simples, staticFile, useCurrentFrame lendo globalThis.__QUADRO_K14__, useVideoConfig, random do
//   remotion de verdade carregado por require, Audio e loadFont vazios);
// - puro: recusa React, Remotion, three, @react-three, SplitText e DrawSVGPlugin (prova que o batidas.ts é puro);
// - rascunho: com K14_RASCUNHO=<pasta>, os arquivos da extensão vêm dessa pasta (resolvidos como se estivessem no
//   lugar); serve pra testar antes de instalar. Sem a variável, valem os arquivos de RM/src/kit/ext/precificacao.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
// no lugar (RM/src/kit/ext/precificacao/testes) a extensão é a pasta de cima; fora dele (rascunho), a do RM
const EXT_NO_RM = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/ext/precificacao";
export const EXT = fs.existsSync(path.resolve(AQUI, "../../../nucleo")) ? path.resolve(AQUI, "..") : path.resolve(EXT_NO_RM);
export const RM = path.resolve(EXT, "../../../..");
export const SRC = path.join(RM, "src");
export const KIT = path.resolve(RM, "../../_kit-motion");
const requireRM = createRequire(path.join(RM, "package.json"));
export const esbuild = requireRM("esbuild");

// erro de dentro do pacote traz a data URL inteira na pilha (megabytes): troca por um rótulo antes de mostrar
export const limpaErro = (e) =>
  String(e && e.stack ? e.stack : e).replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g, "<pacote em memória>").slice(0, 6000);
for (const evento of ["uncaughtException", "unhandledRejection"]) {
  process.on(evento, (e) => {
    console.error(`erro: ${limpaErro(e)}`);
    process.exit(1);
  });
}

const RASCUNHO = process.env.K14_RASCUNHO ? path.resolve(process.env.K14_RASCUNHO) : null;
const MODULOS_EXT = ["batidas", "render", "curvas", "transicoes", "cortes"];

// ---------- plugins ----------

/** os nomes internos que os testes leem dos originais (o texto do arquivo só muda na memória) */
export const EXPORTA = {
  "Motion.tsx": "Camera, Scene, TR, SHAKES, BG, CAP",
  "Broll.tsx": "trOf, SEG, BND, TD, KIND, END0",
};

export const pluginExporta = {
  name: "exporta-internos-k14",
  setup(build) {
    build.onLoad({ filter: /[\\/]src[\\/](Motion|Broll)\.tsx$/ }, (a) => {
      const base = path.basename(a.path);
      const texto = fs.readFileSync(a.path, "utf8");
      return { contents: `${texto}\nexport { ${EXPORTA[base]} };\n`, loader: "tsx", resolveDir: path.dirname(a.path) };
    });
  },
};

const CALCO_REMOTION = `
import * as React from "react";
import { createRequire } from "node:module";
const req = createRequire(${JSON.stringify(path.join(RM, "package.json"))});
const real = req("remotion");
export const random = real.random;
export const staticFile = (p) => "/" + String(p).replace(/^\\/+/, "");
export const useCurrentFrame = () => (typeof globalThis.__QUADRO_K14__ === "number" ? globalThis.__QUADRO_K14__ : 0);
export const useVideoConfig = () => ({ fps: 30, width: 1080, height: 1920, durationInFrames: 900, id: "calco" });
export const AbsoluteFill = ({ style, children }) =>
  React.createElement("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", ...(style || {}) } }, children);
export const Img = (p) => React.createElement("img", p);
export const delayRender = () => 0;
export const continueRender = () => undefined;
export const cancelRender = (e) => { throw e; };
export const Audio = () => null;
export const loadFont = () => Promise.resolve();
`;

export const pluginCalcos = {
  name: "calcos-remotion-k14",
  setup(build) {
    build.onResolve({ filter: /^(remotion|@remotion\/media|@remotion\/fonts)$/ }, () => ({ path: "remotion", namespace: "calco-k14" }));
    build.onLoad({ filter: /.*/, namespace: "calco-k14" }, () => ({ contents: CALCO_REMOTION, loader: "js", resolveDir: RM }));
  },
};

const PROIBIDOS = /^(react|react-dom|react\/.*|remotion|@remotion\/.*|three|three\/.*|@react-three\/.*|gsap\/(SplitText|DrawSVGPlugin)(\.js)?)$/;

export const pluginPuro = {
  name: "puro-k14",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (a) => {
      if (PROIBIDOS.test(a.path)) return { errors: [{ text: `import proibido em módulo puro: "${a.path}" (em ${a.importer || "entrada"})` }] };
      return undefined;
    });
  },
};

export const pluginRascunho = {
  name: "rascunho-k14",
  setup(build) {
    if (!RASCUNHO) return;
    const alvo = new RegExp(`^\\./(${MODULOS_EXT.join("|")})(\\.tsx?)?$`);
    build.onResolve({ filter: alvo }, (a) => {
      const dir = path.resolve(a.resolveDir || "");
      if (dir.toLowerCase() !== EXT.toLowerCase() && dir.toLowerCase() !== RASCUNHO.toLowerCase()) return undefined;
      const nome = a.path.replace(/^\.\//, "").replace(/\.tsx?$/, "");
      for (const ext of [".ts", ".tsx"]) {
        const p = path.join(RASCUNHO, nome + ext);
        if (fs.existsSync(p)) return { path: p, namespace: "rascunho-k14" };
      }
      return undefined;
    });
    build.onLoad({ filter: /.*/, namespace: "rascunho-k14" }, (a) => ({
      contents: fs.readFileSync(a.path, "utf8"),
      loader: a.path.endsWith(".tsx") ? "tsx" : "ts",
      resolveDir: EXT,
    }));
  },
};

// ---------- empacotamento ----------

/** empacota um texto de entrada (resolvido a partir da pasta da extensão) e importa; devolve {modulo, bytes, avisos} */
export async function empacota(conteudo, { nome = "entrada-k14.tsx", plataforma = "node", plugins = [], importa = true } = {}) {
  const r = await esbuild.build({
    bundle: true,
    write: false,
    platform: plataforma,
    format: "esm",
    target: plataforma === "node" ? "node20" : "es2020",
    jsx: "automatic",
    absWorkingDir: RM,
    logLevel: "silent",
    // pacotes CJS (react-dom/server) pedem require de módulo do Node: um require de verdade, preso ao RM
    banner: plataforma === "node" ? { js: `import { createRequire as __criaRequire } from "node:module"; const require = __criaRequire(${JSON.stringify(path.join(RM, "package.json"))});` } : undefined,
    plugins: [pluginRascunho, ...plugins],
    stdin: { contents: conteudo, resolveDir: EXT, sourcefile: nome, loader: "tsx" },
  });
  const codigo = r.outputFiles[0].text;
  let modulo = null;
  if (importa) {
    try {
      modulo = await import("data:text/javascript;base64," + Buffer.from(codigo, "utf8").toString("base64"));
    } catch (e) {
      throw new Error(`o pacote em memória não carregou: ${limpaErro(e)}`);
    }
  }
  return { modulo, bytes: codigo.length, codigo, avisos: r.warnings };
}

/** um arquivo da extensão (o do rascunho, quando K14_RASCUNHO está definido) */
export function arquivoExt(nome) {
  if (RASCUNHO && fs.existsSync(path.join(RASCUNHO, nome))) return path.join(RASCUNHO, nome);
  return path.join(EXT, nome);
}

export const lerJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** compara dois estilos (objetos de CSS): mesmas chaves, números até a tolerância e textos iguais */
export function comparaEstilo(a, b, tol, rotulo, saida) {
  const ka = Object.keys(a || {}).sort();
  const kb = Object.keys(b || {}).sort();
  saida.comparacoes++;
  if (ka.join(",") !== kb.join(",")) {
    saida.chavesDiferentes++;
    if (saida.exemplos.length < 8) saida.exemplos.push(`${rotulo}: chaves ${ka.join(",")} contra ${kb.join(",")}`);
    return;
  }
  for (const k of ka) {
    const x = a[k];
    const y = b[k];
    if (typeof x === "number" && typeof y === "number") {
      const d = Math.abs(x - y);
      if (d > saida.difMax) saida.difMax = d;
      if (d > tol && saida.exemplos.length < 8) saida.exemplos.push(`${rotulo}.${k}: ${x} contra ${y}`);
    } else if (String(x) !== String(y) || typeof x !== typeof y) {
      saida.textosDiferentes++;
      if (saida.exemplos.length < 8) saida.exemplos.push(`${rotulo}.${k}: ${JSON.stringify(x)} contra ${JSON.stringify(y)}`);
    }
  }
}

export const novoResumo = () => ({ instantes: 0, comparacoes: 0, difMax: 0, textosDiferentes: 0, chavesDiferentes: 0, visibilidadeDiferente: 0, exemplos: [] });

export const passou = (r, tol) => r.difMax <= tol && r.textosDiferentes === 0 && r.chavesDiferentes === 0 && r.visibilidadeDiferente === 0;

/** grava o relatório pelo escrita.mjs do K02 (caminho absoluto; cria a pasta) */
export async function gravaRelatorio(caminho, obj) {
  const { gravaJson } = await import(new URL("file:///" + path.join(SRC, "kit", "lib", "escrita.mjs").replace(/\\/g, "/")).href);
  return gravaJson(caminho, obj, { criaPasta: true });
}

/** argumento --saida <arquivo> (opcional) */
export function argSaida(argv) {
  const i = argv.indexOf("--saida");
  if (i >= 0 && argv[i + 1]) {
    const p = argv[i + 1];
    if (!path.isAbsolute(p)) throw new Error("--saida precisa de caminho absoluto");
    return p;
  }
  return null;
}
