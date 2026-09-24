/**
 * Gera `marketing/mockup-filme.html` a partir do que foi capturado.
 *
 * Fonte dos grupos/rótulos/ordem: `telas-flow.ts` do app (via telas-catalogo).
 * Fonte do que existe em disco: `telas-app/_manifesto.json` (escrito pelo
 * shoot-app). Tela que falhou na captura não entra no HTML — mockup que
 * aponta pra imagem quebrada é pior que mockup incompleto.
 *
 * Uso:  node mockup.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { MARKETING, TELAS_APP } from './paths.mjs';
import { lerGrupos, slug } from './telas-catalogo.mjs';

const manifesto = JSON.parse(readFileSync(join(TELAS_APP, '_manifesto.json'), 'utf8'));
const existe = new Set(manifesto.capturadas.map((c) => c.arquivo));
const grupos = lerGrupos();

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let n = 0;
const secoes = grupos
  .map((g) => {
    const cards = g.telas
      .filter((t) => existe.has(`${slug(t.rota)}.png`))
      .map((t) => {
        const num = String(++n).padStart(2, '0');
        const arq = `telas-app/${slug(t.rota)}.png`;
        return `      <figure class="tela">
        <a href="${arq}" target="_blank"><span class="num">${num}</span><img src="${arq}" alt="${esc(t.nome)}" loading="lazy"></a>
        <figcaption>
          <b>${esc(t.nome)}</b>
          <code>${esc(t.rota)}</code>
          <p>${esc(t.nota)}</p>
        </figcaption>
      </figure>`;
      });

    if (!cards.length) return '';
    return `  <section>
    <h2>${esc(g.nome)}</h2>
    <p class="desc">${esc(g.descricao)}</p>
    <div class="grid">
${cards.join('\n')}
    </div>
  </section>`;
  })
  .filter(Boolean)
  .join('\n\n');

const faltando = manifesto.falhou ?? [];
const avisoFalha = faltando.length
  ? `  <div class="falha">⚠️ ${faltando.length} tela(s) não capturaram e ficaram de fora: ${faltando
      .map((f) => `<code>${esc(f.rota)}</code>`)
      .join(' · ')}</div>`
  : '';

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Legalizai · Mockup completo — jornada em ordem</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../identidade/tokens.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--surface-page); color: var(--text-primary);
    font-family: var(--font-sans); padding: 40px 32px 90px;
  }
  header { max-width: 900px; }
  h1 { font-size: 30px; font-weight: 700; letter-spacing: -1px; }
  .sub { color: var(--text-tertiary); font-size: 15px; margin: 8px 0; line-height: 1.5; }
  .como {
    display: inline-block; background: var(--surface-card);
    border-left: 4px solid var(--brand); border-radius: 0 var(--radius-md) var(--radius-md) 0;
    padding: 12px 18px; font-size: 14px; margin: 14px 0 6px;
  }
  .falha {
    background: var(--state-warning-tint); color: var(--state-warning-text);
    border-radius: var(--radius-md); padding: 12px 16px; font-size: 13.5px; margin: 12px 0 0;
  }
  section { margin-top: 46px; }
  h2 {
    font-size: 15px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
    color: var(--action-primary); margin-bottom: 8px;
  }
  .desc { color: var(--text-tertiary); font-size: 13.5px; line-height: 1.55; max-width: 900px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }
  .tela {
    background: var(--surface-card); border: 1px solid var(--border-hairline);
    border-radius: var(--radius-lg); overflow: hidden; position: relative;
  }
  .tela a { display: block; position: relative; }
  .tela img { display: block; width: 100%; height: auto; }
  .num {
    position: absolute; top: 10px; left: 10px; background: var(--action-primary);
    color: var(--text-on-brand); font-weight: 700; font-size: 17px;
    border-radius: var(--radius-sm); padding: 4px 12px;
  }
  figcaption { padding: 12px 14px 14px; }
  figcaption b { display: block; font-size: 13.5px; }
  figcaption code {
    display: block; font-size: 11.5px; color: var(--text-tertiary); margin: 3px 0 7px;
  }
  figcaption p { font-size: 12px; line-height: 1.5; color: var(--text-secondary); }
  a { color: inherit; text-decoration: none; }
</style>
</head>
<body>
  <header>
    <h1>Mockup completo — jornada do app em ordem</h1>
    <p class="sub">As <b>${n} telas</b> do app, capturadas do código real em 1290×2796, na sequência canônica do flow (nomenclatura E·C·A·P). Clique numa tela pra abrir em resolução cheia.</p>
    <div class="como">📽️ Pra montar o filme: me responda no chat com os <b>números na ordem de exibição</b> — ex.: <b>"24, 26, 05, 20"</b></div>
${avisoFalha}
  </header>

${secoes}
</body>
</html>
`;

const destino = join(MARKETING, 'mockup-filme.html');
writeFileSync(destino, html);
console.log(`telas no mockup=${n}  fora=${faltando.length}`);
console.log(`destino=${destino}`);
