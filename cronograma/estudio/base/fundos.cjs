// 22/10 (Pedro): fundos e peças de luz do banco base do editor de Design (Ateliê), feitos em código com o mesmo CSS
// do destaque "Comece por aqui" (marketing/destaques/comece-por-aqui/quadros/destaque.html), pra o documento
// importado bater com o PNG final e pra as peças novas nascerem no mesmo sistema:
//  - fundo-<papel|escuro|coral|vinheta>-<stories|feed>.png: o fundo com os brilhos e o grão de papel, em 1080x1920
//    (stories) e 1080x1350 (feed 4:5). O grão, que no destaque fica por cima de tudo, aqui fica só no fundo
//  - brilho-coral.png: a luz coral redonda atrás da papelada (quadro 2), com alfa
//  - disco-papel.png: o disco de papel com sombra que segura o Léo no fundo coral (quadro 6), com alfa e com a
//    sombra dentro da imagem (100 px de folga em volta do disco de 440)
// Roda só neste PC (Playwright do scripts/render-env com o Edge instalado). Depois rodar o montar-banco.py, que lê
// estes arquivos e monta o catalogo.json.
// Uso: node estudio/base/fundos.cjs
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../scripts/render-env/node_modules/playwright'));

const SAIDA = path.join(__dirname, 'assets');

const GRAO = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: transparent; }
  .q { position: relative; overflow: hidden; isolation: isolate; }
  .q::after { content: ''; position: absolute; inset: 0; background: ${GRAO}; opacity: .07; mix-blend-mode: multiply; pointer-events: none; z-index: 5; }
  .escuro::after, .vinheta::after { mix-blend-mode: overlay; opacity: .12; }
  .papel {
    background:
      radial-gradient(60% 34% at 100% 0%, rgba(242,100,60,.10), transparent 70%),
      radial-gradient(55% 30% at 0% 100%, rgba(242,100,60,.08), transparent 70%),
      #FAF8F5;
  }
  .escuro {
    background:
      radial-gradient(120% 80% at 15% 0%, rgba(242,100,60,.22), transparent 60%),
      linear-gradient(160deg, #2A2E37 0%, #15171C 62%, #202433 100%);
  }
  .coral {
    background:
      radial-gradient(70% 40% at 100% 0%, rgba(255,255,255,.16), transparent 70%),
      radial-gradient(60% 36% at 0% 100%, rgba(180,50,20,.25), transparent 70%),
      #F2643C;
  }
  .vinheta { background: linear-gradient(180deg, #392829 0%, #2B2528 34%, #22222A 62%, #1A1E24 100%); }
  .brilho { width: 1100px; height: 900px; background: radial-gradient(closest-side, rgba(242,100,60,.18), rgba(242,100,60,0)); }
  .folga { padding: 100px; width: 640px; height: 640px; }
  .disco { width: 440px; height: 440px; border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #FFFFFF, #FAF0E8 70%); box-shadow: 0 30px 60px rgba(120,40,15,.25); }
`;

const FORMATOS = { stories: [1080, 1920], feed: [1080, 1350] };
const FUNDOS = ['papel', 'escuro', 'coral', 'vinheta'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1300, height: 2000 }, deviceScaleFactor: 1 });
  const corpo = [];
  for (const f of FUNDOS) for (const [fmt, [w, h]] of Object.entries(FORMATOS)) {
    corpo.push(`<section class="q ${f}" id="${f}-${fmt}" style="width:${w}px;height:${h}px"></section>`);
  }
  corpo.push('<div class="brilho" id="brilho"></div>');
  corpo.push('<div class="folga" id="folga"><div class="disco"></div></div>');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${corpo.join('')}</body></html>`);
  for (const f of FUNDOS) for (const fmt of Object.keys(FORMATOS)) {
    const nome = `fundo-${f}-${fmt}.png`;
    await page.locator(`#${f}-${fmt}`).screenshot({ path: path.join(SAIDA, nome) });
    console.log('ok', nome);
  }
  await page.locator('#brilho').screenshot({ path: path.join(SAIDA, 'brilho-coral.png'), omitBackground: true });
  console.log('ok brilho-coral.png');
  await page.locator('#folga').screenshot({ path: path.join(SAIDA, 'disco-papel.png'), omitBackground: true });
  console.log('ok disco-papel.png');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
