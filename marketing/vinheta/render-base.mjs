// Captura a base 2D da vinheta (fundo + halo + wordmark) frame a frame.
// Padrão do pipeline/render18.mjs, parametrizado por aspecto/fps/escala.
//
//   node render-base.mjs [16x9|9x16] [fps] [scale]
//   node render-base.mjs 16x9 30 1      → piloto 1280x720? não: viewport fixa
//                                          1920x1080; scale 2 = 4K.
//   node render-base.mjs 16x9 60 2      → master 3840x2160
//
// Saída: frames-base-<aspecto>/f%05d.png

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
// playwright vem do node_modules do pipeline — mesma versão dos browsers já
// instalados; a vinheta não carrega dependência própria.
const require = createRequire(join(AQUI, '..', 'pipeline', 'x.js'));
const { chromium } = require('playwright');

const ASPECT = process.argv[2] || '16x9';
const FPS = Number(process.argv[3] || 30);
const SCALE = Number(process.argv[4] || 1);
// --stream: em vez de 559 PNGs (~1,4GB em 4K), os screenshots vão por pipe
// direto pro ffmpeg e viram UM arquivo x264 CRF6 4:4:4 (~200-400MB) —
// visualmente transparente pra uma camada que ainda será re-encodada no
// compose. Nasceu do dia em que o disco chegou a 0 bytes livres (10/08).
const STREAM = process.argv.includes('--stream');
if (!['16x9', '9x16'].includes(ASPECT)) throw new Error(`aspecto inválido: ${ASPECT}`);

const TIMING = JSON.parse(readFileSync(join(AQUI, 'timing.json'), 'utf8'));
const VIEW = ASPECT === '16x9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
const SAIDA = join(AQUI, `frames-base-${ASPECT}`);
const SAIDA_MP4 = join(AQUI, `frames-base-${ASPECT}.mp4`);

if (!STREAM) {
  rmSync(SAIDA, { recursive: true, force: true });
  mkdirSync(SAIDA, { recursive: true });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: SCALE });
// injeta a fonte única de timing ANTES do script da página rodar (fail-loud lá)
await page.addInitScript(({ timing, aspect }) => {
  window.__TIMING = timing;
  window.__ASPECT = aspect;
}, { timing: TIMING, aspect: ASPECT });

await page.goto(pathToFileURL(join(AQUI, 'src', 'vinheta-base.html')).href,
  { waitUntil: 'networkidle', timeout: 90000 });
// Sora fail-loud (regra do vault, mesmo padrão do screens.mjs): o slogan usa
// texto vivo — cair em fallback entregaria métrica errada.
const faltando = await page.evaluate(async () => {
  const pesos = ['600 64px Sora'];
  for (const p of pesos) await document.fonts.load(p);
  await document.fonts.ready;
  return pesos.filter((p) => !document.fonts.check(p));
});
if (faltando.length) {
  await browser.close();
  throw new Error(`Sora não carregou (${faltando.join(' | ')}) — sem rede? O slogan sairia em fallback.`);
}
await page.waitForTimeout(300);

const dur = await page.evaluate(() => window.__dur);
const total = Math.round((dur / 1000) * FPS);
console.log(`[base] ${ASPECT} dur=${dur}ms fps=${FPS} scale=${SCALE} frames=${total} -> ${STREAM ? SAIDA_MP4 : SAIDA}`);

let ff = null;
if (STREAM) {
  const { spawn } = await import('node:child_process');
  // CRF 2 (quase-lossless): o CRF6 quantizava os passos do degradê escuro já
  // na primeira geração e o master herdava banding — lição dos "borrões" de 11/08
  ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS),
    '-i', 'pipe:0', '-c:v', 'libx264', '-crf', '2', '-preset', 'slow',
    '-pix_fmt', 'yuv444p', SAIDA_MP4], { stdio: ['pipe', 'inherit', 'inherit'] });
}
for (let i = 0; i < total; i++) {
  await page.evaluate((tt) => window.__render(tt), (i / FPS) * 1000);
  if (STREAM) {
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  } else {
    await page.screenshot({ path: join(SAIDA, `f${String(i).padStart(5, '0')}.png`) });
  }
  if (i % 60 === 0) console.log(`[base] frame ${i}/${total}`);
}
if (STREAM) {
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg saiu com ${c}`)))));
}
console.log(`[base] pronto: ${total} frames`);
await browser.close();
