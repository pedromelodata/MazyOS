import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

import { TELAS_APP as OUT } from './paths.mjs';
mkdirSync(OUT, { recursive: true });

const routes = JSON.parse(readFileSync('routes.json', 'utf8'));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, // iPhone 15 Pro Max, em pt
  deviceScaleFactor: 3, // 1290x2796 px
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  colorScheme: 'light',
});
const page = await ctx.newPage();

const slug = (u) =>
  u
    .replace('https://legalizeiapp-web.vercel.app/', '')
    .replace(/\?v=0$/, '')
    .replace(/[?&=]/g, '-')
    .replace(/\//g, '_') || 'root';

const done = [];
for (const r of routes) {
  const name = slug(r.src);
  try {
    await page.goto(r.src, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1800); // deixa animação de entrada assentar
    await page.screenshot({ path: `${OUT}/${name}.png` });
    done.push(name);
    console.log(`OK   ${name}`);
  } catch (e) {
    console.log(`FALHA ${name}  ${e.message.split('\n')[0]}`);
  }
}

console.log(`\ncapturadas=${done.length}/${routes.length}`);
console.log(`destino=${OUT}`);
await browser.close();
