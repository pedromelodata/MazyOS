// Captura o Início do protótipo publicado (prototipo.legalizai.com.br/inicio) em 430x932 a 3x (1290x2796), com a barra
// de status do sistema (9:41) e sem o selo de teste: o topo e, rolado até o fim, a Vigia fiscal e o Pró-labore
// inteligente. Uso: node captura.mjs PASTA_SAIDA
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'file:///C:/Legalizei/legalizei/app/node_modules/playwright/index.mjs';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  locale: 'pt-BR', colorScheme: 'light', reducedMotion: 'reduce',
});
const page = await ctx.newPage();
await page.goto('https://prototipo.legalizai.com.br/inicio', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(1500);
await page.addStyleTag({ content: `
  :root { --safe-top: 54px !important; }
  #barra-status { position: fixed; top: 0; left: 0; right: 0; height: 54px; z-index: 2147483647; pointer-events: none;
    display: flex; align-items: center; justify-content: space-between; padding: 6px 30px 0 40px;
    font: 600 17px -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif; color: #111; letter-spacing: -0.2px; }
  #barra-status .ic { display: flex; gap: 6px; align-items: center; }
` });
const escondidos = await page.evaluate(() => {
  let n = 0;
  // o selo de teste do ensaio (o lápis com a data, ou o 🧪): no app de verdade ele não existe
  // só elemento pequeno (o texto do selo inteiro tem poucas letras): nunca o body nem um container do app
  for (const el of document.querySelectorAll('button, a, div, span')) {
    const t = (el.textContent || '').trim();
    if (t.length > 30 || !(/🧪/.test(t) || /P[O0]\s*·\s*\d{2}\/\d{2}\/\d{4}/.test(t))) continue;
    const fixo = el.closest('[class*="fixed"]');
    const alvo = fixo && (fixo.textContent || '').trim().length <= 30 ? fixo : el;
    alvo.style.display = 'none';
    n++;
  }
  const s = document.createElement('div');
  s.id = 'barra-status';
  s.innerHTML = `<span>9:41</span><span class="ic">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#111"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#111"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#111"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#111"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0z" fill="#111"/><path d="M3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.2 1.2a4.8 4.8 0 0 0-6.8 0z" fill="#111"/><path d="M1.2 4.6a9.6 9.6 0 0 1 13.6 0l-1.2 1.2a7.9 7.9 0 0 0-11.2 0z" fill="#111"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="#111" stroke-opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#111"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill="#111" fill-opacity=".45"/></svg>
  </span>`;
  document.body.appendChild(s);
  return n;
});
console.log('selos escondidos:', escondidos);
await page.waitForTimeout(600);
await page.screenshot({ path: join(OUT, 'inicio-topo.png') });
// rola o miolo até o fim: aparecem a Vigia fiscal e o Pró-labore inteligente
const rolou = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 10);
  if (!el) { window.scrollTo(0, document.documentElement.scrollHeight); return 'janela'; }
  el.scrollTop = el.scrollHeight;
  return `${el.scrollTop}/${el.scrollHeight}`;
});
console.log('rolou:', rolou);
await page.waitForTimeout(1200);
await page.screenshot({ path: join(OUT, 'inicio-vigia.png') });
await browser.close();
console.log('ok', OUT);
