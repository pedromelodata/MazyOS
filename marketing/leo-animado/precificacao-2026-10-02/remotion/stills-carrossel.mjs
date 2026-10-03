// Render das 7 telas do carrossel de 05/10 (Contabilidade tradicional e Legalizaí): um bundle e um navegador só.
//   node stills-carrossel.mjs [quadro ...]        (sem quadro = os 7; rodar de dentro da pasta remotion)
// Entry próprio (src/carrossel-2026-10-05/index.ts) e public próprio (public-carrossel, só hardlinks).
// Revisão v3: render em scale 2 (2160 x 2700) e redução com Lanczos no pos.py logo depois de cada quadro (a PNG
// grande é temporária e some na hora). Bundle sem cache do webpack (o source map fica: o renderer lê o index.js.map).
// Confere o disco antes (aborta abaixo de 400 MB) e, no fim, apaga o bundle e os perfis do Chrome que esta rodada
// deixou no Temp. Os logs "CARROSSEL" da cena vão pro qa-cena.json.
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const RAIZ = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion";
const PECA = "C:/MKT-INSTA/Content Legalizai/marketing/carrosseis/2026-10-05-tradicional-vs-legalizai";
const SAIDA = path.join(PECA, "png");
const PY = "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe";
const POS = path.join(PECA, "pos.py");
const CH = "C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe";
const BIN = path.join(RAIZ, "bin"); // absoluto (relativo, o ffmpeg falha no quadro 0)
const NOMES = ["01-capa.png", "02-abrir-a-empresa.png", "03-a-guia-do-mes.png", "04-caso-fora-do-padrao.png", "05-o-que-voce-paga.png", "06-antes-de-assinar.png", "07-fecho.png"];
const MIN_MB = 400;
const ESCALA = 2;

const livreMB = () => {
  const s = fs.statfsSync("C:/");
  return (s.bavail * s.bsize) / 1024 / 1024;
};
const livre = livreMB();
console.log(`disco: ${livre.toFixed(0)} MB livres no C:`);
if (livre < MIN_MB) {
  console.error(`ABORTADO: menos de ${MIN_MB} MB livres no C: (o render precisa de uns 60 MB e a regra do ambiente pede margem)`);
  process.exit(3);
}

const pedidos = process.argv.slice(2).map(Number);
const quadros = pedidos.length ? pedidos : [0, 1, 2, 3, 4, 5, 6];
for (const q of quadros) if (!(q >= 0 && q <= 6)) throw new Error(`quadro inválido: ${q}`);
for (const f of ["Sora-wght.ttf", "3d/iphone.glb", "marca/simbolo.svg", "marca/logo-horizontal.svg", "telas/tela-splash.png", "telas/tela-home-dia1.png", "telas/tela-inicio-pagar.png", "telas/tela-declaracoes.png", "telas/tela-documentos.png"]) {
  if (!fs.existsSync(path.join(RAIZ, "public-carrossel", f))) throw new Error(`falta public-carrossel/${f} (rodar o prepara.ps1 da peça)`);
}
fs.mkdirSync(SAIDA, { recursive: true });

const TEMP = os.tmpdir();
const perfisAntes = new Set(fs.readdirSync(TEMP).filter((n) => n.startsWith("puppeteer_dev_chrome_profile-")));
const logs = [];
let serveUrl = null;
let browser = null;
let falhou = false;
try {
  serveUrl = await bundle({
    entryPoint: path.join(RAIZ, "src/carrossel-2026-10-05/index.ts"),
    publicDir: path.join(RAIZ, "public-carrossel"),
    enableCaching: false, // nada em node_modules/.cache
  });
  const chromiumOptions = { gl: "angle" };
  browser = await openBrowser("chrome", { browserExecutable: CH, chromiumOptions });
  const composition = await selectComposition({ serveUrl, id: "Carrossel", puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions });
  for (const q of quadros) {
    const out = path.join(SAIDA, NOMES[q]);
    const grande = path.join(SAIDA, `_2x-${NOMES[q]}`);
    const t0 = Date.now();
    await renderStill({
      composition,
      serveUrl,
      output: grande,
      frame: q,
      imageFormat: "png",
      scale: ESCALA,
      puppeteerInstance: browser,
      binariesDirectory: BIN,
      chromiumOptions,
      overwrite: true,
      timeoutInMilliseconds: 240000,
      onBrowserLog: (l) => {
        if (l.text.startsWith("CARROSSEL")) logs.push(l.text);
        if (l.type === "error" || l.text.startsWith("CARROSSEL_")) console.log(`  [${q}] ${l.text}`);
      },
    });
    // redução Lanczos pra 1080 x 1350, RGB com sRGB embutido; a PNG grande sai na hora
    execFileSync(PY, ["-B", POS, "--reduz", grande, out], { stdio: "inherit" });
    fs.rmSync(grande, { force: true });
    console.log("ok", q, NOMES[q], `${Date.now() - t0} ms`);
  }
} catch (e) {
  falhou = true;
  console.error("ERRO no render:", e);
} finally {
  if (browser) await browser.close({ silent: true }).catch(() => {});
  for (const n of fs.existsSync(SAIDA) ? fs.readdirSync(SAIDA) : []) if (n.startsWith("_2x-")) fs.rmSync(path.join(SAIDA, n), { force: true });
  // o bundle() da API Node não se apaga sozinho
  const real = (p) => fs.realpathSync.native(p).toLowerCase();
  if (serveUrl && fs.existsSync(serveUrl) && path.basename(serveUrl).startsWith("remotion-webpack-bundle-") && real(path.dirname(serveUrl)) === real(TEMP)) {
    fs.rmSync(serveUrl, { recursive: true, force: true });
  } else if (serveUrl) {
    console.log(`bundle mantido (fora do Temp esperado): ${serveUrl}`);
  }
  // perfis do Chrome criados por esta rodada (o Chrome solta a pasta uns instantes depois de fechar: tenta de novo)
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const n of fs.readdirSync(TEMP)) {
    if (!n.startsWith("puppeteer_dev_chrome_profile-") || perfisAntes.has(n)) continue;
    for (let i = 0; i < 6; i++) {
      try {
        fs.rmSync(path.join(TEMP, n), { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        break;
      } catch (e) {
        if (i === 5) console.log(`perfil do Chrome não saiu (${e.code}): ${n}`);
        else await espera(1000);
      }
    }
  }
}
const qa = logs
  .filter((t) => t.startsWith("CARROSSEL "))
  .map((t) => {
    try {
      return JSON.parse(t.slice("CARROSSEL ".length));
    } catch {
      return { bruto: t };
    }
  });
// mantém o QA dos quadros que não foram refeitos nesta rodada
const qaArq = path.join(PECA, "qa-cena.json");
let anterior = [];
try {
  anterior = JSON.parse(fs.readFileSync(qaArq, "utf8"));
} catch {
  anterior = [];
}
const porTela = new Map(anterior.filter((c) => typeof c.tela === "number").map((c) => [c.tela, c]));
for (const c of qa) if (typeof c.tela === "number") porTela.set(c.tela, c);
fs.writeFileSync(qaArq, JSON.stringify([...porTela.values()].sort((a, b) => a.tela - b.tela), null, 1) + "\n");
console.log(`disco depois: ${livreMB().toFixed(0)} MB livres`);
process.exit(falhou ? 1 : 0);
