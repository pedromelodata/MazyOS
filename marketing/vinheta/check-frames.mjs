// Gera a sequência do check se desenhando — textura por frame pro material da
// face do símbolo no Blender (Image Sequence node).
//
// O path é o do legalizei-branding/simbolo.svg, verbatim — geometria final
// pixel-idêntica à marca. O "desenho" é um wipe em 2 segmentos:
//   descida  (braço curto, checkIni→checkMeio, outExpo)
//   subida   (braço longo,  checkMeio→checkFim, outExpo)
// implementado como união de dois half-planes varrendo ao longo da direção de
// cada traço (rect rotacionado como clip), padrão canvas→PNG do screens.mjs.
//
//   node check-frames.mjs [fps]        (fps deve casar com o do render 3D)
//
// Saída: blender/tex-check/check_%04d.png (2048², RGBA, 1-based: check_0001 = frame 0)

import { createRequire } from 'node:module';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(AQUI, '..', 'pipeline', 'x.js'));
const { chromium } = require('playwright');

const FPS = Number(process.argv[2] || 30);
const T = JSON.parse(readFileSync(join(AQUI, 'timing.json'), 'utf8'));
const BEAT = 60000 / T.bpm;
const DUR = Math.round(BEAT * T.beats);
const TOTAL = Math.round((DUR / 1000) * FPS);
const OUT = join(AQUI, 'blender', 'tex-check');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');

await page.evaluate(({ T, BEAT }) => {
  const K = 2048 / 211.09;                       // viewBox do simbolo.svg
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 2048;
  const ctx = cv.getContext('2d');
  // path do check, verbatim de simbolo.svg
  const CHECK = new Path2D('M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87z');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const norm = (t, a, b) => clamp((t - a) / (b - a));
  const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const ms = (b) => BEAT * b;

  // varreduras em coords do SVG: [ânguloDaDireção, projMin, projMax, clipX0, clipX1]
  const SEGS = [
    [Math.PI / 4, 78, 208, -10, 127],           // descida: braço curto, ↘
    [-Math.PI / 4, -30, 130, 100, 220],          // subida: braço longo, ↗
  ];

  window.__checkFrame = (tMs) => {
    const ps = [
      outExpo(norm(tMs, ms(T.events.checkIni), ms(T.events.checkMeio))),
      outExpo(norm(tMs, ms(T.events.checkMeio), ms(T.events.checkFim))),
    ];
    ctx.clearRect(0, 0, 2048, 2048);
    ctx.save();
    ctx.scale(K, K);
    ctx.fillStyle = '#ffffff';
    SEGS.forEach(([ang, c0, c1, x0, x1], i) => {
      if (ps[i] <= 0) return;
      const c = c0 + ps[i] * (c1 - c0);
      ctx.save();
      // limite espacial do segmento (evita o braço longo aparecer na descida)
      ctx.beginPath(); ctx.rect(x0, -300, x1 - x0, 900); ctx.clip();
      // half-plane: proj ao longo da direção do traço ≤ c
      ctx.rotate(ang);
      ctx.beginPath(); ctx.rect(-600, -600, 600 + c, 1200); ctx.clip();
      ctx.rotate(-ang);
      ctx.fill(CHECK);
      ctx.restore();
    });
    ctx.restore();
    return cv.toDataURL('image/png');
  };
}, { T, BEAT });

console.log(`[check] fps=${FPS} frames=${TOTAL} -> ${OUT}`);
for (let i = 0; i < TOTAL; i++) {
  const dataURL = await page.evaluate((t) => window.__checkFrame(t), (i / FPS) * 1000);
  writeFileSync(join(OUT, `check_${String(i + 1).padStart(4, '0')}.png`),
    Buffer.from(dataURL.split(',')[1], 'base64'));
  if (i % 60 === 0) console.log(`[check] frame ${i}/${TOTAL}`);
}
console.log('[check] pronto');
await browser.close();
