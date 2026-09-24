import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync, rmSync } from 'node:fs';

import { FINAL_SRC, FRAMES } from './paths.mjs';
import { join } from 'node:path';

const HTML = join(FINAL_SRC, 'final-18s.html');
const FPS = Number(process.argv[2] || 30);
const SCALE = Number(process.argv[3] || 1); // 1 = 1080p, 2 = 4K

// `--sem-3d` esconde os canvases WebGL do ato 4, deixando só fundo, símbolo e
// texto. É a base pra sobrepor o render do Blender (marketing/blender) — se os
// aparelhos do WebGL ficassem, os dois apareceriam fantasmando um sobre o outro.
// Sai em pasta própria pra não sobrescrever os frames da versão normal.
const SEM_3D = process.argv.includes('--sem-3d');
const SAIDA = SEM_3D ? `${FRAMES}-sem3d` : FRAMES;

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: SCALE,
});
await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
if (await page.evaluate(() => !!window.__s4init)) {
  await page.evaluate(() => window.__s4init());
  await page.waitForFunction(() => window.__s4ready === true, { timeout: 30000 });
  console.log('cena 3D inicializada');
}
if (SEM_3D) {
  const n = await page.evaluate(() => {
    const cs = document.querySelectorAll('#s4 .gl');
    cs.forEach((c) => { c.style.display = 'none'; });
    return cs.length;
  });
  console.log(`--sem-3d: ${n} canvas(es) escondido(s) — ato 4 sai sem os aparelhos`);
}
await page.waitForTimeout(800);

const dur = await page.evaluate(() => window.__dur);
const total = Math.round((dur / 1000) * FPS);
console.log(`dur=${dur}ms fps=${FPS} scale=${SCALE} frames=${total} -> ${SAIDA}`);

for (let i = 0; i < total; i++) {
  await page.evaluate((tt) => window.__render(tt), (i / FPS) * 1000);
  await page.screenshot({ path: `${SAIDA}/f${String(i).padStart(5, '0')}.png` });
  if (i % 120 === 0) console.log(`frame ${i}/${total}`);
}
console.log(`pronto: ${total} frames`);
await browser.close();
