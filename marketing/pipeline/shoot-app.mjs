/**
 * Captura TODAS as telas do app a partir do catálogo do próprio repo.
 *
 * Substitui o `shoot.mjs` (que lia `routes.json`, uma lista congelada de 28
 * URLs da Vercel). A lista agora vem de `telas-flow.ts` — a fonte única que o
 * app usa pro `/mockup` e pra `/apresentacao`. Tela nova no produto aparece
 * aqui sozinha, sem ninguém editar lista.
 *
 * Pré-requisito: o app rodando local.
 *   cd C:/PedroProjects/legalizei/app && npm run dev     → :3000
 *
 * Uso:  node shoot-app.mjs [--base http://localhost:3000] [--so=rota]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { TELAS_APP as OUT } from './paths.mjs';
import { lerGrupos, slug } from './telas-catalogo.mjs';

const arg = (n, padrao) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}`));
  return hit ? hit.split('=')[1] ?? process.argv[process.argv.indexOf(hit) + 1] : padrao;
};

const BASE = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const SO = arg('so', null);

const grupos = lerGrupos();
const telas = grupos.flatMap((g) => g.telas.map((t) => ({ ...t, grupo: g.id })));
const alvo = SO ? telas.filter((t) => t.rota.includes(SO)) : telas;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, // iPhone 15 Pro Max, em pt
  deviceScaleFactor: 3, // → 1290x2796 px, igual às capturas antigas
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  colorScheme: 'light',
  reducedMotion: 'reduce', // congela entrada/typewriter: captura estável
});
const page = await ctx.newPage();

const ok = [];
const falhou = [];

for (const t of alvo) {
  const nome = slug(t.rota);
  try {
    await page.goto(`${BASE}${t.rota}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200); // deixa fonte e layout assentarem
    await page.screenshot({ path: join(OUT, `${nome}.png`) });
    ok.push({ ...t, arquivo: `${nome}.png` });
    console.log(`OK    ${nome}`);
  } catch (e) {
    falhou.push({ rota: t.rota, erro: e.message.split('\n')[0] });
    console.log(`FALHA ${nome}  ${e.message.split('\n')[0]}`);
  }
}

// Manifesto: o que de fato existe em disco, pro gerador do mockup não
// referenciar tela que falhou na captura.
writeFileSync(
  join(OUT, '_manifesto.json'),
  JSON.stringify({ base: BASE, capturadas: ok, falhou }, null, 2),
);

console.log(`\ncapturadas=${ok.length}/${alvo.length}  falhas=${falhou.length}`);
console.log(`destino=${OUT}`);
await browser.close();
