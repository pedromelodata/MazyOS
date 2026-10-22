// Grava a tela de verdade do protÃ³tipo do app (repo Legalizei, ramo ME de /emitir) no fluxo de emissÃ£o:
// preenche cliente, valor e serviÃ§o, toca em "Revisar nota", e na folha de resumo grava o toque em
// "Emitir nota de R$ 1.200,00" com a resposta do app (o confete da marca que vira o check e "Nota nÂº ... emitida").
//
// A gravaÃ§Ã£o Ã© a tela do app quadro a quadro (CDP screencast, em 2x), com o tempo de cada quadro, e o tempo do toque
// (dedo desce e sobe) vai num JSON ao lado, pra sincronizar com o dedo do vÃ­deo.
//
// Uso:  node grava_emissao.mjs PASTA_SAIDA [segundos_antes_do_toque] [ms_com_o_dedo_no_botao]
// Precisa do app rodando em http://localhost:3000 (npm run dev em C:/Legalizei/legalizei/app).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'file:///C:/Legalizei/legalizei/app/node_modules/playwright/index.mjs';

const OUT = process.argv[2] || 'gravacao';
const ANTES = Number(process.argv[3] || 1.2);
const SEGURA = Number(process.argv[4] || 130);
const DEPOIS = 3.2;
mkdirSync(join(OUT, 'quadros'), { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
const passo = async (nome) => { await page.screenshot({ path: join(OUT, `passo-${nome}.png`), scale: 'css' }); console.log('passo', nome); };

await page.goto('http://localhost:3000/emitir', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(800);
// como num celular de verdade: a barra de status do sistema no alto (hora, sinal, wi-fi e bateria), com o conteúdo
// descendo pela área segura; e sem o selo de teste do ensaio (🧪 P0), que não existe no app
await page.addStyleTag({ content: `
  :root { --safe-top: 54px !important; }
  .app-page { padding-top: 54px !important; }
  #barra-status { position: fixed; top: 0; left: 0; right: 0; height: 54px; z-index: 2147483647; pointer-events: none;
    display: flex; align-items: center; justify-content: space-between; padding: 6px 30px 0 40px;
    font: 600 17px -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif; color: #111; letter-spacing: -0.2px; }
  #barra-status .ic { display: flex; gap: 6px; align-items: center; }
` });
await page.evaluate(() => {
  for (const b of document.querySelectorAll('button')) {
    if ((b.textContent || '').includes('🧪')) { const p = b.parentElement; (p && p.classList.contains('fixed') ? p : b).style.display = 'none'; }
  }
  const s = document.createElement('div');
  s.id = 'barra-status';
  s.innerHTML = `<span>17:42</span><span class="ic">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#111"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#111"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#111"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#111"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0z" fill="#111"/><path d="M3.4 6.8a6.5 6.5 0 0 1 9.2 0l-1.2 1.2a4.8 4.8 0 0 0-6.8 0z" fill="#111"/><path d="M1.2 4.6a9.6 9.6 0 0 1 13.6 0l-1.2 1.2a7.9 7.9 0 0 0-11.2 0z" fill="#111"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="#111" stroke-opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#111"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill="#111" fill-opacity=".45"/></svg>
  </span>`;
  document.body.appendChild(s);
});
await page.waitForTimeout(300);
await passo('1-form');

// cliente
await page.getByText('Construtora', { exact: false }).first().click();
await page.waitForTimeout(400);
// valor: o primeiro campo depois de "Qual o valor?"
const valor = page.locator('input[inputmode="decimal"], input[inputmode="numeric"]').first();
await valor.click();
await valor.fill('');
await page.keyboard.type('120000', { delay: 40 });
await page.waitForTimeout(300);
await page.keyboard.press('Tab');
await page.waitForTimeout(300);
// serviÃ§o
await page.getByText('Propaganda e publicidade', { exact: false }).first().click();
await page.waitForTimeout(400);
await passo('2-preenchido');

const revisar = page.locator('[data-cap="emitir.revisar"]');
console.log('botÃ£o revisar:', await revisar.innerText());
await revisar.scrollIntoViewIfNeeded();
await revisar.click();
await page.waitForTimeout(900);
await passo('3-depois-revisar');

// se vier a checagem antes, segue emitindo assim
for (const rotulo of ['Emitir assim', 'Emitir mesmo assim', 'Continuar', 'Seguir']) {
  const b = page.getByRole('button', { name: rotulo });
  if (await b.count()) { console.log('checagem: tocando em', rotulo); await b.first().click(); await page.waitForTimeout(900); break; }
}
const emitir = page.getByRole('button', { name: /Emitir nota de/ });
await emitir.waitFor({ state: 'visible', timeout: 15000 });
console.log('botÃ£o emitir:', await emitir.innerText());
await page.waitForTimeout(1200);
await passo('4-resumo');

// gravaÃ§Ã£o: screencast de cada repintura, com o tempo
const cdp = await ctx.newCDPSession(page);
const quadros = [];
let t0 = null;
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const t = metadata.timestamp;
  if (t0 === null) t0 = t;
  const i = quadros.length;
  const nome = `q${String(i).padStart(4, '0')}.jpg`;
  writeFileSync(join(OUT, 'quadros', nome), Buffer.from(data, 'base64'));
  quadros.push({ nome, t: t - t0 });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 96, maxWidth: 860, maxHeight: 1864, everyNthFrame: 1 });
// um repinto pra marcar o comeÃ§o
await page.evaluate(() => { document.body.style.outline = '0px solid transparent'; });
const inicio = await page.evaluate(() => performance.now());
await page.waitForTimeout(ANTES * 1000);

// o toque: dedo desce no meio do botÃ£o, segura, sobe
const box = await emitir.boundingBox();
const x = box.x + box.width / 2, y = box.y + box.height / 2;
const tDesce = (await page.evaluate(() => performance.now())) - inicio;
await page.mouse.move(x, y);
await page.mouse.down();
await page.waitForTimeout(SEGURA);
await page.mouse.up();
const tSobe = (await page.evaluate(() => performance.now())) - inicio;
await page.waitForTimeout(DEPOIS * 1000);
await cdp.send('Page.stopScreencast');
await page.waitForTimeout(300);
await passo('5-final');

const info = { botao: { x, y, w: box.width, h: box.height }, viewport: { w: 430, h: 932, escala: 2 },
  toque_desce_s: tDesce / 1000, toque_sobe_s: tSobe / 1000, quadros };
writeFileSync(join(OUT, 'gravacao.json'), JSON.stringify(info, null, 1));
console.log(`quadros=${quadros.length} desce=${(tDesce / 1000).toFixed(3)}s sobe=${(tSobe / 1000).toFixed(3)}s ultimo=${quadros.at(-1)?.t.toFixed(3)}s`);
await browser.close();

