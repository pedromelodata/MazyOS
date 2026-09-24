// Captura as telas escolhidas pro FILME direto do app local (Next dev em
// localhost:3000), a 430×932pt @3x = 1290×2796 — mesmo formato do shoot.mjs.
// Saída: marketing/telas-filme/<ordem>-<nome>.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { MARKETING } from './paths.mjs';

const OUT = join(MARKETING, 'telas-filme');
mkdirSync(OUT, { recursive: true });

// Escolha do Pedro (11/08): N1, N2, N3, N4 Gate-CNAE, N4 Atende — nesta ordem
const TELAS = [
  ['01-N1-splash',    'http://localhost:3000/splash?v=0'],
  ['02-N2-welcome',   'http://localhost:3000/welcome?v=0'],
  ['03-N3-entrada',   'http://localhost:3000/entrada?v=0'],
  ['04-N4-gate-cnae', 'http://localhost:3000/gate?v=0'],
  ['05-N4-atende',    'http://localhost:3000/veredito/atende?v=0'],
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
// o badge "N" do Next dev não pode vazar pro filme
await page.addInitScript(() => {
  const css = 'nextjs-portal, #__next-build-watcher, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }';
  const aplicar = () => {
    const s = document.createElement('style');
    s.textContent = css;
    document.documentElement.appendChild(s);
  };
  if (document.readyState !== 'loading') aplicar();
  else document.addEventListener('DOMContentLoaded', aplicar);
});
for (const [nome, url] of TELAS) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  // cinto e suspensório: remove qualquer overlay de dev que tenha sobrado
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal, #__next-build-watcher, [data-nextjs-toast], [data-next-badge-root]')
      .forEach((e) => e.remove());
  });
  await page.screenshot({ path: join(OUT, `${nome}.png`) });
  console.log('[filme]', nome);
}
await browser.close();
console.log('[filme] pronto ->', OUT);
