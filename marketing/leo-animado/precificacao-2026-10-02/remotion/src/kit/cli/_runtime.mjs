// Runtime comum da CLI do kit em Node (dono K07; contrato: KIT/DESENHO.md, seções 4.3, 4.4, 4.10 e 4.11).
//
// O que faz:
// - empacota em memória, com o esbuild do RM/node_modules, uma entrada com o núcleo e as batidas (nada vai pro
//   disco) e importa por data URL;
// - acha as extensões por busca de arquivos (RM/src/kit/ext/<nome>/batidas.ts) e empacota cada uma isolada, com
//   o gsap e o CustomEase do núcleo injetados (uma instância só: as eases e a timeline são as mesmas). Extensão com
//   erro de empacotamento ou de execução fica desligada com aviso "EXT_ERRO"; só a peça que pede algo dela falha;
// - prepara o gsap pra Node (ticker.lagSmoothing(0) e ticker.sleep(); sem isso o setTimeout do ticker segura o
//   processo) e, no fim, sai com process.exit;
// - carrega o catálogo pelo "catalogo.py exporta" (K01) no Python do corte-viral, sempre com -B;
// - lê a peça: pasta (nome em KIT/pecas ou caminho absoluto), cena (--cena; o sufixo das saídas vem do nome dela),
//   narração, regiões e o fecho.json do K03.
//
// Só leitura: quem grava é o RM/src/kit/lib/escrita.mjs (K02).
// Variável de teste: KIT_EXT_DIR=<pasta> troca a pasta das extensões (só pra provar o isolamento).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RM = path.resolve(AQUI, "../../..");
export const KIT = path.resolve(RM, "../../_kit-motion");
export const PUBLIC_KIT = path.join(RM, "public-kit");
export const PASTA_EXT = process.env.KIT_EXT_DIR ? path.resolve(process.env.KIT_EXT_DIR) : path.join(RM, "src", "kit", "ext");
export const PY = "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe";
export const CATALOGO_PY = path.join(KIT, "catalogos", "catalogo.py");
export const FECHO_JSON = path.join(KIT, "voz", "fecho", "fecho.json");

const requireRM = createRequire(path.join(RM, "package.json"));
export const esbuild = requireRM("esbuild");

// ---------- erros com código de saída ----------
export class ErroCli extends Error {
  constructor(msg, codigo = 1) {
    super(msg);
    this.name = "ErroCli";
    this.codigo = codigo;
  }
}

// ---------- empacotamento ----------
const BASE_ESBUILD = {
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  target: "node20",
  absWorkingDir: RM,
  logLevel: "silent",
};

// o núcleo é puro (seção 4.3): React, Remotion, SplitText e DrawSVGPlugin não podem entrar no pacote dele
const PROIBIDOS_NUCLEO = /^(react|react-dom|remotion|@remotion\/.*|@react-three\/.*|gsap\/(SplitText|DrawSVGPlugin)(\.js)?)$/;

const pluginNucleoPuro = {
  name: "nucleo-puro-k07",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (a) => {
      if (PROIBIDOS_NUCLEO.test(a.path)) {
        return { errors: [{ text: `import proibido no núcleo do kit: "${a.path}" (em ${a.importer || "entrada"})` }] };
      }
      return undefined;
    });
  },
};

const ENTRADA_NUCLEO = `
import * as gsapModulo from "gsap";
import * as customEaseModulo from "gsap/CustomEase";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
export { gsap, CustomEase, gsapModulo, customEaseModulo };
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

async function importaCodigo(codigo) {
  return import("data:text/javascript;base64," + Buffer.from(codigo, "utf8").toString("base64"));
}

/** calços das extensões: o gsap e o CustomEase vêm da instância do núcleo (globalThis.__KIT_CLI__) */
function calcos(nucleo) {
  const nomesGsap = Object.keys(nucleo.gsapModulo).filter((k) => k !== "default" && /^[A-Za-z_$][\w$]*$/.test(k));
  const nomesCe = Object.keys(nucleo.customEaseModulo).filter((k) => k !== "default" && /^[A-Za-z_$][\w$]*$/.test(k));
  return {
    gsap:
      "const m = globalThis.__KIT_CLI__.gsapModulo;\n" +
      "export default (m.default || m.gsap);\n" +
      nomesGsap.map((k) => `export const ${k} = m.${k};`).join("\n"),
    CustomEase:
      "const m = globalThis.__KIT_CLI__.customEaseModulo;\n" +
      "export default (m.default || m.CustomEase);\n" +
      nomesCe.map((k) => `export const ${k} = m.${k};`).join("\n"),
    SplitText:
      "export class SplitText { constructor() { throw new Error('SplitText não existe em Node (calço do K07)'); } }\n" +
      "export default SplitText;",
    DrawSVGPlugin: "export const DrawSVGPlugin = { name: 'DrawSVGPlugin (calço do K07)' };\nexport default DrawSVGPlugin;",
    // o mesmo calço do K02 (seção 4.11): só registra as três eases da marca, e só se ainda não existirem
    useMasterTimeline:
      "const g = globalThis.__KIT_CLI__.gsap;\n" +
      "const CE = globalThis.__KIT_CLI__.CustomEase;\n" +
      "const CURVAS = globalThis.__KIT_CLI__.CURVAS_MARCA;\n" +
      "for (const nome of Object.keys(CURVAS)) { if (!CE.get(nome)) CE.create(nome, CURVAS[nome]); }\n" +
      "export { g as gsap };\n" +
      "export class SplitText { constructor() { throw new Error('SplitText não existe em Node (calço do K07)'); } }\n" +
      "export function useMasterTimeline() { throw new Error('calço do K07: useMasterTimeline não existe em Node'); }\n",
  };
}

function pluginCompartilhado(nucleo) {
  const C = calcos(nucleo);
  return {
    name: "kit-compartilhado-k07",
    setup(build) {
      build.onResolve({ filter: /^gsap(\/index(\.js)?)?$/ }, () => ({ path: "gsap", namespace: "kit-k07" }));
      build.onResolve({ filter: /^gsap\/(dist\/)?CustomEase(\.js)?$/ }, () => ({ path: "CustomEase", namespace: "kit-k07" }));
      build.onResolve({ filter: /^gsap\/(dist\/)?SplitText(\.js)?$/ }, () => ({ path: "SplitText", namespace: "kit-k07" }));
      build.onResolve({ filter: /^gsap\/(dist\/)?DrawSVGPlugin(\.js)?$/ }, () => ({ path: "DrawSVGPlugin", namespace: "kit-k07" }));
      build.onResolve({ filter: /(^|[\\/])useMasterTimeline(\.tsx?)?$/ }, () => ({ path: "useMasterTimeline", namespace: "kit-k07" }));
      build.onLoad({ filter: /.*/, namespace: "kit-k07" }, (a) => ({ contents: C[a.path], loader: "js", resolveDir: RM }));
    },
  };
}

/** extensões achadas por busca de arquivos: RM/src/kit/ext/<nome>/batidas.ts */
export function achaExtensoes(pasta = PASTA_EXT) {
  if (!fs.existsSync(pasta)) return [];
  return fs
    .readdirSync(pasta, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => ({ nome: d.name, batidas: path.join(pasta, d.name, "batidas.ts"), midia: path.join(pasta, d.name, "midia.json") }))
    .filter((e) => fs.existsSync(e.batidas))
    .sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));
}

const mensagem = (e) => {
  if (e && Array.isArray(e.errors) && e.errors.length) return e.errors.map((x) => x.text).join("; ");
  return e && e.message ? e.message : String(e);
};

let runtimeCache = null;

/**
 * Carrega o núcleo e as extensões. Devolve
 * { nucleo, gsap, CustomEase, extensoes: [{nome, ok, erro, batidas, camadas}], registro, camadasConhecidas, metaCamadas, avisos }.
 */
export async function carregaRuntime({ extensoes = true } = {}) {
  if (runtimeCache) return runtimeCache;
  const avisos = [];
  const r = await esbuild.build({
    ...BASE_ESBUILD,
    plugins: [pluginNucleoPuro],
    stdin: { contents: ENTRADA_NUCLEO, resolveDir: AQUI, sourcefile: "nucleo-cli-k07.ts", loader: "ts" },
  });
  const nucleo = await importaCodigo(r.outputFiles[0].text);
  const { gsap, CustomEase } = nucleo;
  preparaGsap(gsap);
  nucleo.registraEases(gsap, CustomEase);
  globalThis.__KIT_CLI__ = {
    gsap,
    CustomEase,
    gsapModulo: nucleo.gsapModulo,
    customEaseModulo: nucleo.customEaseModulo,
    CURVAS_MARCA: nucleo.CURVAS_MARCA,
  };

  const lista = [];
  if (extensoes) {
    for (const e of achaExtensoes()) {
      const ext = { nome: e.nome, ok: false, erro: null, batidas: {}, camadas: {}, arquivo: e.batidas, midia: fs.existsSync(e.midia) ? e.midia : null };
      try {
        const b = await esbuild.build({ ...BASE_ESBUILD, plugins: [pluginCompartilhado(nucleo)], entryPoints: [e.batidas] });
        const mod = await importaCodigo(b.outputFiles[0].text);
        ext.batidas = (mod && mod.batidas) || {};
        ext.camadas = (mod && mod.camadas) || {};
        ext.ok = true;
      } catch (err) {
        ext.erro = mensagem(err);
        ext.batidas = {};
        ext.camadas = {};
        avisos.push(`EXT_ERRO ${e.nome}: ${ext.erro} (extensão desligada; só a peça que pedir algo dela falha)`);
      }
      lista.push(ext);
    }
  }

  // registro: núcleo primeiro; nome repetido fica com o primeiro (como o ext.ts do K06)
  const registro = {};
  const dono = {};
  for (const k of Object.keys(nucleo.BATIDAS_NUCLEO)) {
    registro[k] = nucleo.BATIDAS_NUCLEO[k];
    dono[k] = "núcleo";
  }
  const metaCamadas = {};
  const donoCamada = {};
  for (const ext of lista) {
    if (!ext.ok) continue;
    for (const k of Object.keys(ext.batidas)) {
      if (registro[k]) {
        avisos.push(`EXT_AVISO ${ext.nome}: batida "${k}" já existe (${dono[k]}); fica a primeira`);
        continue;
      }
      registro[k] = ext.batidas[k];
      dono[k] = `extensão ${ext.nome}`;
    }
    for (const k of Object.keys(ext.camadas)) {
      if (metaCamadas[k]) {
        avisos.push(`EXT_AVISO ${ext.nome}: tipo de camada "${k}" já existe (${donoCamada[k]}); fica o primeiro`);
        continue;
      }
      metaCamadas[k] = ext.camadas[k];
      donoCamada[k] = `extensão ${ext.nome}`;
    }
  }
  runtimeCache = {
    nucleo,
    gsap,
    CustomEase,
    extensoes: lista,
    registro,
    donoBatida: dono,
    metaCamadas,
    donoCamada,
    camadasConhecidas: Object.keys(metaCamadas),
    avisos,
  };
  return runtimeCache;
}

/** gsap em Node: sem suavização de atraso e com o ticker dormindo (o ticker acorda a cada timeline nova) */
export function preparaGsap(gsap) {
  if (gsap && gsap.ticker) {
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.sleep();
  }
}

/** extensões desligadas que a peça pede: erro claro (a peça só falha se pedir algo delas) */
export function confereExtensoesDaCena(rt, cena) {
  const desligadas = rt.extensoes.filter((e) => !e.ok);
  if (!desligadas.length) return [];
  const pedidas = (cena.batidas || []).map((b) => b && b.id).filter((id) => id && !rt.registro[id]);
  const camadas = (cena.camadas || []).map((c) => c && c.tipo).filter((t) => t && !rt.metaCamadas[t]);
  if (!pedidas.length && !camadas.length) return [];
  return [
    `a cena pede ${pedidas.map((x) => `batida ${x}`).concat(camadas.map((x) => `camada ${x}`)).join(", ")}, e há extensão desligada por erro: ` +
      desligadas.map((e) => `${e.nome} (${e.erro})`).join("; "),
  ];
}

// ---------- catálogo ----------
export function carregaCatalogo() {
  if (process.env.KIT_CATALOGO) {
    return { catalogo: lerJson(process.env.KIT_CATALOGO), origem: `KIT_CATALOGO=${process.env.KIT_CATALOGO}` };
  }
  if (!fs.existsSync(CATALOGO_PY)) throw new ErroCli(`catálogo do K01 não existe: ${CATALOGO_PY}`);
  const r = spawnSync(PY, ["-B", CATALOGO_PY, "exporta"], {
    cwd: path.dirname(CATALOGO_PY),
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8" },
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: 180000,
  });
  if (r.status !== 0 || !r.stdout) {
    throw new ErroCli(`catalogo.py exporta falhou (código ${r.status}): ${String(r.stderr || r.error || "").trim().slice(0, 2000)}`);
  }
  try {
    return { catalogo: JSON.parse(r.stdout), origem: "catalogo.py exporta (K01)" };
  } catch (e) {
    throw new ErroCli(`catalogo.py exporta não devolveu JSON: ${e.message}`);
  }
}

// ---------- peça, cena e entradas ----------
export const lerJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** pasta da peça: caminho absoluto, ou nome dentro de KIT/pecas */
export function pastaDaPeca(arg) {
  if (!arg) throw new ErroCli("falta a pasta da peça (nome em KIT/pecas ou caminho absoluto)", 2);
  const p = path.isAbsolute(arg) ? path.resolve(arg) : path.join(KIT, "pecas", arg);
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) throw new ErroCli(`a pasta da peça não existe: ${p}`, 2);
  return p;
}

/** sufixo das saídas pelo nome da cena: cenas.json dá "", cenas-kit.json dá "-kit", outra.json dá "-outra" */
export function sufixoDaCena(caminhoCena) {
  const nome = path.basename(caminhoCena);
  if (nome === "cenas.json") return "";
  const m = /^cenas-(.+)\.json$/i.exec(nome);
  if (m) return "-" + m[1];
  return "-" + nome.replace(/\.json$/i, "");
}

/** argumentos comuns: <pasta> [--cena <arquivo>] e as opções pedidas (bandeiras sem valor em `bandeiras`) */
export function argumentos(argv, { bandeiras = [], opcoes = [] } = {}) {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const nome = a.slice(2);
      if (bandeiras.indexOf(nome) >= 0) op[nome] = true;
      else if (nome === "cena" || opcoes.indexOf(nome) >= 0) {
        if (i + 1 >= argv.length) throw new ErroCli(`a opção --${nome} pede um valor`, 2);
        op[nome] = argv[++i];
      } else throw new ErroCli(`opção desconhecida: ${a}`, 2);
    } else pos.push(a);
  }
  return { pos, op };
}

/** lê a peça: {pasta, nome, caminhoCena, cena, sufixo}. O nome da peça é o nome da PASTA: a cena com "peca" diferente
 *  é recusada (rodada 4, 03/10), porque as travas (trilha e modelos aceitos com risco, a exceção da peça de teste)
 *  valem pela pasta; copiar a cena de outra peça não leva a decisão dela */
export function lePeca(argPasta, argCena) {
  const pasta = pastaDaPeca(argPasta);
  const nome = path.basename(pasta);
  const caminhoCena = argCena ? (path.isAbsolute(argCena) ? path.resolve(argCena) : path.join(pasta, argCena)) : path.join(pasta, "cenas.json");
  if (!fs.existsSync(caminhoCena)) throw new ErroCli(`a cena não existe: ${caminhoCena}`, 2);
  let cena;
  try {
    cena = lerJson(caminhoCena);
  } catch (e) {
    throw new ErroCli(`a cena não é JSON válido (${caminhoCena}): ${e.message}`);
  }
  if (cena && typeof cena.peca === "string" && cena.peca !== nome) {
    throw new ErroCli(
      `a cena ${caminhoCena} diz "peca": "${cena.peca}", mas a pasta é ${nome}: as travas valem pela pasta, nunca pelo campo da cena; ` +
        `se a cena veio de outra peça, troque "peca" por "${nome}" (a decisão de risco da outra peça não vem junto); se você renomeou a pasta, faça o mesmo`,
      2,
    );
  }
  return { pasta, nome, caminhoCena, cena, sufixo: sufixoDaCena(caminhoCena) };
}

/** narração (obrigatória, relativa à pasta da peça), regiões (quando a cena aponta pra arquivo) e o fecho.json */
export function leEntradas(peca) {
  const { pasta, cena } = peca;
  const relNarr = cena.narracao || "voz/narracao.json";
  const caminhoNarr = path.isAbsolute(relNarr) ? relNarr : path.join(pasta, relNarr);
  if (!fs.existsSync(caminhoNarr)) {
    throw new ErroCli(`a narração da cena não existe: ${caminhoNarr} (rode kit.py voz-alinha ${peca.nome})`);
  }
  const narracao = lerJson(caminhoNarr);
  let regioes = null;
  let origemRegioes = "inline na cena";
  if (typeof cena.regioes === "string") {
    const cr = path.isAbsolute(cena.regioes) ? cena.regioes : path.join(pasta, cena.regioes);
    if (!fs.existsSync(cr)) throw new ErroCli(`as regiões da cena não existem: ${cr} (rode kit.py telas ${peca.nome})`);
    regioes = lerJson(cr);
    origemRegioes = cr;
  }
  let fecho = null;
  let origemFecho = "padrão (aiAcende 0,94): o fecho.json do K03 não existe";
  if (fs.existsSync(FECHO_JSON)) {
    fecho = lerJson(FECHO_JSON);
    origemFecho = FECHO_JSON;
  }
  return { narracao, caminhoNarr, regioes, origemRegioes, fecho, origemFecho };
}

/** caminho de uma saída da peça com o sufixo da cena: saida(peca, "props", ".json") dá <pasta>/props-kit.json */
export function saidaDaPeca(peca, base, ext, subpasta = "") {
  return path.join(peca.pasta, subpasta, `${base}${peca.sufixo}${ext}`);
}

/** props da peça já gravadas (props<sufixo>.json); avisa se a cena é mais nova que elas */
export function leProps(peca) {
  const caminho = saidaDaPeca(peca, "props", ".json");
  if (!fs.existsSync(caminho)) throw new ErroCli(`as props não existem: ${caminho} (rode kit.py props ${peca.nome}${peca.sufixo ? " --cena " + path.basename(peca.caminhoCena) : ""})`);
  const avisos = [];
  const mc = fs.statSync(peca.caminhoCena).mtimeMs;
  const mp = fs.statSync(caminho).mtimeMs;
  if (mc > mp + 1) avisos.push(`a cena (${path.basename(peca.caminhoCena)}) é mais nova que as props (${path.basename(caminho)}): rode kit.py props de novo`);
  return { props: lerJson(caminho), caminho, avisos };
}

/** roda a função principal de um script da CLI e sai com o código certo (dormindo o ticker do gsap antes) */
export async function principal(fn) {
  let codigo = 0;
  try {
    codigo = (await fn()) || 0;
  } catch (e) {
    if (e instanceof ErroCli) {
      console.error(`erro: ${e.message}`);
      codigo = e.codigo;
    } else if (e && (e.name === "EscritaRecusada" || e.name === "DiscoInsuficiente")) {
      console.error(`erro: ${e.message}`);
      codigo = 1;
    } else {
      console.error(`erro inesperado: ${e && e.stack ? e.stack : e}`);
      codigo = 1;
    }
  }
  if (runtimeCache) preparaGsap(runtimeCache.gsap);
  process.exit(codigo);
}

/** número com 9 casas (nada de -0) */
export const m9 = (x) => {
  const r = Math.round(x * 1e9) / 1e9;
  return r === 0 ? 0 : r;
};
export const m3 = (x) => {
  const r = Math.round(x * 1e3) / 1e3;
  return r === 0 ? 0 : r;
};
