// Recaptura as telas do app (protótipo do repo Legalizei atualizado em 02/10) numa pasta NOVA, sem tocar nas
// capturas antigas. Mesmo padrão do marketing/pipeline/shoot-app.mjs (iPhone 15 Pro Max, 430x932 pt @3x =
// 1290x2796 px), lendo o catálogo do caminho certo desta máquina.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'file:///C:/Legalizei/legalizei/app/node_modules/playwright/index.mjs';
import { lerGrupos, slug } from 'file:///C:/MKT-INSTA/Content%20Legalizai/marketing/pipeline/telas-catalogo.mjs';

const BASE = 'http://localhost:3000';
const OUT = 'C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02';
const CATALOGO = 'C:/Legalizei/legalizei/app/src/lib/telas-flow.ts';
const so = process.argv.find((a) => a.startsWith('--so='))?.split('=')[1];

const telas = lerGrupos(CATALOGO).flatMap((g) => g.telas.map((t) => ({ ...t, grupo: g.id })));
const alvo = so ? telas.filter((t) => t.rota.includes(so)) : telas;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
const page = await ctx.newPage();
const ok = [];
const falhou = [];
for (const t of alvo) {
  const nome = slug(t.rota);
  try {
    await page.goto(`${BASE}${t.rota}`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, `${nome}.png`) });
    ok.push({ ...t, arquivo: `${nome}.png` });
    console.log(`OK    ${nome}`);
  } catch (e) {
    falhou.push({ rota: t.rota, erro: e.message.split('\n')[0] });
    console.log(`FALHA ${nome}  ${e.message.split('\n')[0]}`);
  }
}
writeFileSync(join(OUT, '_manifesto.json'), JSON.stringify({ base: BASE, capturadoEm: '2026-10-02', repo: 'C:/Legalizei/legalizei @ ab68dbc', capturadas: ok, falhou }, null, 2));
console.log(`\ncapturadas=${ok.length}/${alvo.length}  falhas=${falhou.length}  destino=${OUT}`);
await browser.close();
