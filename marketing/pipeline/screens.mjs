// Gera as texturas de tela em PNG pro modelo do Blender.
// Reaproveita screens-draw.js — o MESMO código que a cena Three.js usa — então
// a tela do render do Blender é pixel-a-pixel a mesma do 3D em tempo real.
//
//   node screens.mjs [escala]     escala 1 = 780x1688 (nativo), 2 = 1560x3376
//
// Saída: ../blender/tex/tela-app.png (estado A) e tela-lock.png (estado B)

import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TEX = join(AQUI, '..', 'blender', 'tex');
const W = 780, H = 1688;
const K = Number(process.argv[2] ?? 2);

// Sora nos pesos que o desenho usa — sem isso o canvas cai em fallback e o
// texto sai com métrica errada.
const PESOS = [
  '600 36px Sora', '700 64px Sora', '700 104px Sora', 'italic 500 46px Sora',
  '500 44px Sora', '700 250px Sora', '600 40px Sora',
];

const bundle = await build({
  entryPoints: [join(AQUI, 'screens-draw.js')],
  bundle: true, format: 'iife', globalName: 'SD', write: false,
});
const codigo = bundle.outputFiles[0].text;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap">
</head><body></body></html>`, { waitUntil: 'networkidle' });

await page.addScriptTag({ content: codigo });

const faltando = await page.evaluate(async (pesos) => {
  for (const p of pesos) await document.fonts.load(p);
  await document.fonts.ready;
  return pesos.filter((p) => !document.fonts.check(p));
}, PESOS);

if (faltando.length) {
  await browser.close();
  throw new Error(`Sora não carregou nos pesos: ${faltando.join(' | ')} — sem rede? O desenho cairia em fallback e a métrica do texto sairia errada.`);
}

const alvos = [
  { nome: 'tela-app.png', fn: 'drawEstadoA' },
  { nome: 'tela-lock.png', fn: 'drawEstadoB' },
];

await mkdir(TEX, { recursive: true });
for (const { nome, fn } of alvos) {
  const dataURL = await page.evaluate(({ fn, w, h, k }) => {
    const cv = document.createElement('canvas');
    cv.width = w * k; cv.height = h * k;
    const ctx = cv.getContext('2d');
    ctx.scale(k, k);            // desenho é vetorial, escala sem perder nitidez
    window.SD[fn](ctx, w, h);
    return cv.toDataURL('image/png');
  }, { fn, w: W, h: H, k: K });

  const buf = Buffer.from(dataURL.split(',')[1], 'base64');
  await writeFile(join(TEX, nome), buf);
  console.log(`${nome}  ${W * K}x${H * K}  ${(buf.length / 1024).toFixed(0)} KB`);
}

await browser.close();
