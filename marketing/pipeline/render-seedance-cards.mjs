// Renderiza os cards do filme seedance (end-card e paper-void) em PNG 1920x1080.
// Roda de dentro de marketing/pipeline (onde o node_modules com playwright vive):
//   node render-seedance-cards.mjs papervoid
//   node render-seedance-cards.mjs endcard
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';

const VAULT = 'C:/PedroProjects/Projects/Legalizei_Videos';
const targets = {
  papervoid: {
    html: `${VAULT}/marketing/filme/seedance/endcard/paper-void.html`,
    out: `${VAULT}/marketing/filme/seedance/frames/paper-void.png`,
    needsFont: false,
  },
  darkvoid: {
    html: `${VAULT}/marketing/filme/seedance/endcard/dark-void.html`,
    out: `${VAULT}/marketing/filme/seedance/frames/dark-void.png`,
    needsFont: false,
  },
  endcard: {
    html: `${VAULT}/marketing/filme/seedance/endcard/endcard.html`,
    out: `${VAULT}/marketing/filme/seedance/endcard/endcard-1920x1080.png`,
    needsFont: true,
    needsFile: `${VAULT}/marketing/filme/seedance/stills/still-05-crop.png`,
  },
  endcarddark: {
    html: `${VAULT}/marketing/filme/seedance/endcard/endcard-dark.html`,
    out: `${VAULT}/marketing/filme/seedance/endcard/endcard-dark-1920x1080.png`,
    needsFont: true,
    needsFile: `${VAULT}/marketing/filme/seedance/stills-dark/still-05-crop-dark.png`,
  },
};

const t = targets[process.argv[2]];
if (!t) throw new Error('alvo: papervoid | endcard');
if (t.needsFile && !existsSync(t.needsFile)) throw new Error(`falta ${t.needsFile}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(t.html).href);
if (t.needsFont) {
  // Fail-loud: a Sora TEM que estar ativa antes do screenshot (regra do vault).
  try {
    await page.waitForFunction(() => document.fonts.check('600 30px Sora'), { timeout: 15000 });
  } catch {
    await browser.close();
    throw new Error('Sora NAO carregou: o data URI do @font-face nao foi injetado?');
  }
}
await page.screenshot({ path: t.out });
await browser.close();
console.log('ok:', t.out);
