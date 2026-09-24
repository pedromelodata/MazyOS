// Grava as 5 telas do FILME em MOVIMENTO (app real dirigido por script):
// digitação no gate-CNAE, respiros de scroll, veredito aparecendo — pra
// virarem texturas de vídeo no display do iPhone 3D (upgrade "telas vivas").
// Requer o app local de pé: cd C:\Legalizai && npm run dev
//
//   node gravacao-telas.mjs
// Saída: marketing/telas-filme/video/<ordem>-<nome>.mp4 (860x1864 @30fps)
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { MARKETING } from './paths.mjs';

const OUT = join(MARKETING, 'telas-filme', 'video');
const TMP = join(OUT, '_tmp');
mkdirSync(TMP, { recursive: true });

// [nome, rota, duração_s, ação-por-tela]
const TELAS = [
  ['01-N1-splash', 'http://localhost:3000/splash?v=0', 8, async () => {}],
  ['02-N2-welcome', 'http://localhost:3000/welcome?v=0', 8, async (page) => {
    // navega os slides do onboarding com calma
    await page.waitForTimeout(2500);
    const btn = page.locator('button, [role="button"]').first();
    if (await btn.count()) await btn.click({ trial: false }).catch(() => {});
    await page.waitForTimeout(2500);
  }],
  ['03-N3-entrada', 'http://localhost:3000/entrada?v=0', 11, async (page) => {
    await page.waitForTimeout(3000);
    // passeio do mouse pelas 3 rotas (hover states)
    for (const i of [0, 1, 2]) {
      const op = page.locator('button, a, [role="button"]').nth(i);
      if (await op.count()) await op.hover().catch(() => {});
      await page.waitForTimeout(1800);
    }
  }],
  ['04-N4-gate-cnae', 'http://localhost:3000/gate?v=0', 8, async (page) => {
    await page.waitForTimeout(1500);
    const campo = page.locator('textarea, input[type="text"]').first();
    if (await campo.count()) {
      await campo.click().catch(() => {});
      await campo.pressSequentially('Faço sites e lojas virtuais pra pequenos negócios', { delay: 85 }).catch(() => {});
    }
  }],
  ['05-N4-atende', 'http://localhost:3000/veredito/atende?v=0', 13, async (page) => {
    await page.waitForTimeout(4000);
    // abre o "E se eu faço mais de uma coisa?" e fecha — vida sutil
    const acc = page.locator('text=E se eu faço').first();
    if (await acc.count()) {
      await acc.click().catch(() => {});
      await page.waitForTimeout(3000);
      await acc.click().catch(() => {});
    }
  }],
];

const browser = await chromium.launch();
for (const [nome, url, dur, acao] of TELAS) {
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: TMP, size: { width: 860, height: 1864 } },
  });
  const page = await ctx.newPage();
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
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const t0 = Date.now();
  await acao(page);
  const resto = dur * 1000 - (Date.now() - t0);
  if (resto > 0) await page.waitForTimeout(resto);
  await ctx.close();   // fecha o vídeo
  const webm = readdirSync(TMP).find((f) => f.endsWith('.webm'));
  const alvo = join(OUT, `${nome}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', join(TMP, webm),
    '-r', '30', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', alvo]);
  rmSync(join(TMP, webm));
  console.log('[gravacao]', nome, `${dur}s ->`, alvo);
}
rmSync(TMP, { recursive: true, force: true });
await browser.close();
console.log('[gravacao] pronto ->', OUT);
