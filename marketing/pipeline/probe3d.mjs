import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';

import { FINAL_SRC } from './paths.mjs';
import { join } from 'node:path';

const HTML = join(FINAL_SRC, 'final-18s.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => console.log('pagina:', m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('ERRO:', e.message.slice(0, 300)));

await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle', timeout: 90000 });
const gl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const g = c.getContext('webgl2');
  return g ? g.getParameter(g.RENDERER) : 'SEM WEBGL2';
});
console.log('webgl2:', gl);

await page.evaluate(() => window.__s4init());
await page.waitForFunction(() => window.__s4ready === true, { timeout: 30000 });
console.log('cena pronta');

for (const [nome, t] of [['p-entrada', 15000], ['p-estadoA', 15900], ['p-estadoB', 17600]]) {
  await page.evaluate((tt) => window.__render(tt), t);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${nome}.png` });
  console.log(`ok ${nome}`);
}
await browser.close();
