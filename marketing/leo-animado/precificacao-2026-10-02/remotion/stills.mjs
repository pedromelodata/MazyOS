// Renderiza vários quadros de uma composição com um bundle e um navegador só (iteração rápida).
//   node stills.mjs <Composicao> <pasta-saida> <public-dir> <quadro> [<quadro> ...]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [id, outDir, publicDir, ...frames] = process.argv.slice(2);
const CH = "C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe";
const BIN = path.resolve("bin");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve(publicDir) });
const chromiumOptions = { gl: "angle" };
const browser = await openBrowser("chrome", { browserExecutable: CH, chromiumOptions });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions });
for (const f of frames) {
  const out = path.join(outDir, `${id}-${String(f).padStart(4, "0")}.png`);
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output: out, frame: Number(f), puppeteerInstance: browser, binariesDirectory: BIN, chromiumOptions, overwrite: true });
  console.log("ok", f, `${Date.now() - t0} ms`);
}
await browser.close({ silent: true });
// o bundle() da API Node não se apaga sozinho (cerca de 50 MB por rodada no Temp): limpa aqui
fs.rmSync(serveUrl, { recursive: true, force: true });
