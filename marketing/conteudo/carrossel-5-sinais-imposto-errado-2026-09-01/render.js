const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 });
  const url = 'file:///' + path.resolve(__dirname, 'carrossel.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const outDir = path.join(__dirname, 'instagram');
  fs.mkdirSync(outDir, { recursive: true });

  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    await slides[i].scrollIntoViewIfNeeded();
    await slides[i].screenshot({ path: path.join(outDir, `slide-${n}.png`) });
    console.log(`slide-${n}.png ok`);
  }

  await browser.close();
  console.log(`Rendered ${slides.length} slides -> ${outDir}`);
})().catch(e => { console.error(e); process.exit(1); });
