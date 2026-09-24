/**
 * Gera a página do design system Legalizai.
 * Os hex saem da lista abaixo, conferida contra o Storybook (Fundações/Cor).
 * Fonte e logos entram como data: URI — a CSP do Artifact bloqueia host externo.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MEDIA = 'C:/PedroProjects/legalizei/app/.next/dev/static/media';
const LOGOS = 'C:/PedroProjects/Projects/Legalizei_Videos/identidade/logos';
const b64 = (p) => readFileSync(p).toString('base64');

const soraLatin = b64(`${MEDIA}/c41ca59f1c34ba31-s.p.2y2uoi4t910qy.woff2`);
const soraExt = b64(`${MEDIA}/b886574ba42c3409-s.1_wjncogyh-s7.woff2`);
const logoClaro = b64(`${LOGOS}/legalizai-logo-horizontal.svg`);
const logoEscuro = b64(`${LOGOS}/legalizai-logo-negativa-clara.svg`);

const coral = [
  ['50', '#FEF3EE', 'tint de fundo'], ['100', '#FBDDD1', 'hover de superfície'],
  ['200', '#F8C3B0', 'borda suave, chip'], ['300', '#F5A184', 'ilustração'],
  ['400', '#F47F58', 'acento claro'], ['500', '#F2643C', 'marca — logo e wordmark'],
  ['600', '#DD4E27', 'fill de botão'], ['700', '#B83D1C', 'hover · botão pequeno'],
  ['800', '#8C2F16', 'texto sobre coral'], ['900', '#5C1F0F', 'profundidade máxima'],
];
const ink = [
  ['white', '#FFFFFF', 'superfície de card'], ['50', '#FAF8F5', 'papel quente — fundo'],
  ['100', '#F1EEE9', 'superfície alternada'], ['200', '#E3DED7', 'hairline'],
  ['300', '#CBC5BC', 'borda forte'], ['400', '#A19B92', 'placeholder — nunca leitura'],
  ['500', '#736E67', 'texto terciário'], ['600', '#524E48', 'texto secundário'],
  ['700', '#34363C', '—'], ['800', '#24262C', 'superfície escura'],
  ['900', '#1B1E24', 'texto primário e CTA escuro'],
];
const estado = [
  ['em dia', 'success', '#E7F6EF', '#17A06A', '#0B5E40'],
  ['vence em breve', 'warning', '#FDF3E1', '#F5A524', '#98600A'],
  ['vencido', 'danger', '#FCEBEB', '#E03E43', '#971F25'],
  ['dica', 'info', '#EBF2FC', '#3B82E0', '#2360B8'],
];
const semanticos = [
  ['surface-page', 'ink-50', 'papel quente, não branco'],
  ['surface-card', 'white', 'card sobre o papel'],
  ['surface-alt', 'ink-100', 'faixa alternada'],
  ['surface-dark', 'ink-800', 'bloco escuro, hero'],
  ['surface-tint-brand', 'coral-50', 'destaque suave'],
  ['border-hairline', 'ink-200', 'a separação padrão'],
  ['border-strong', 'ink-300', 'divisor'],
  ['border-focus', 'coral-600', 'foco sempre visível'],
  ['text-primary', 'ink-900', ''],
  ['text-secondary', 'ink-600', ''],
  ['text-tertiary', 'ink-500', ''],
  ['text-muted', 'ink-400', 'só placeholder e disabled'],
  ['action-primary', 'coral-600', 'AA só em texto grande'],
  ['action-primary-sm', 'coral-700', 'botão pequeno'],
  ['action-primary-hover', 'coral-700', 'hover escurece'],
  ['action-dark', 'ink-900', 'CTA escuro'],
  ['brand', 'coral-500', 'só logo e wordmark'],
];
const escalaTipo = [
  ['display', 32, 1.15, 700, 'o número grande, veredito'],
  ['h1', 26, 1.2, 700, 'título de tela'],
  ['h2', 20, 1.3, 600, 'título de bloco'],
  ['body', 16, 1.5, 400, 'corpo padrão'],
  ['caption', 14, 1.4, 400, 'apoio, legenda'],
  ['micro', 12, 1.4, 500, 'carimbo, meta'],
];
const raios = [
  ['sm', 8, 'chip, badge'], ['md', 12, 'input, botão'],
  ['lg', 16, 'card'], ['xl', 24, 'sheet, modal'], ['full', 999, 'pill, avatar'],
];
const espacos = [[1, 4, 'ícone ↔ label'], [2, 8, 'interno de chip'], [3, 12, 'interno de input'],
  [4, 16, 'interno de card'], [5, 24, 'padding lateral da página'], [6, 32, 'separação de seção'],
  [7, 48, 'respiro de bloco'], [8, 64, 'topo e rodapé']];
const arquetipos = [
  ['A1', 'Pergunta', 'input, escolha, toggle', 'o mais comum. Erro inline, nunca modal'],
  ['A2', 'Veredito', 'verde, âmbar, vermelho', 'nunca veredito com baixa confiança'],
  ['A3', 'Argumento e prova', 'a economia projetada', 'número grande + carimbo de estimativa'],
  ['A4', 'Simulador', 'o clímax do produto', 'input, resultado, memória de cálculo'],
  ['A5', 'Recap e revisão', 'antes de assinar', 'editar volta ao passo, não reinicia'],
  ['A6', 'Aceite jurídico', 'contrato, termo', 'botão único. Texto legal nunca atrás de expander'],
  ['A7', 'Espera', 'as 5 pausas', 'estado + previsão honesta + aviso proativo'],
  ['A8', 'Painel e timeline', 'a constituição', '9 etapas × 4 estados'],
  ['A9', 'Saída graciosa', '5 saídas terminais', 'um template só: explica, captura, roteia'],
  ['A10', 'Erro recuperável', 'recusa de órgão', '"precisa de você" + ação concreta'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const swatch = (nome, hex, uso, prefixo) => `
      <div class="sw">
        <div class="sw-chip" style="background:${hex}"></div>
        <div class="sw-txt"><code>${prefixo}${nome}</code><span class="hex">${hex}</span>${uso && uso !== '—' ? `<span class="uso">${esc(uso)}</span>` : ''}</div>
      </div>`;

const html = `<title>Design system · Legalizai</title>
<style>
@font-face{font-family:Sora;font-style:normal;font-weight:100 800;font-display:block;
  src:url(data:font/woff2;base64,${soraLatin}) format("woff2");
  unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:Sora;font-style:normal;font-weight:100 800;font-display:block;
  src:url(data:font/woff2;base64,${soraExt}) format("woff2");
  unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}

/* Paleta clara = os tokens reais do produto. */
:root{
  --papel:#FAF8F5; --card:#FFFFFF; --alt:#F1EEE9;
  --hairline:#E3DED7; --forte:#CBC5BC;
  --tinta:#1B1E24; --tinta-2:#524E48; --tinta-3:#736E67;
  --acao:#DD4E27; --acao-forte:#B83D1C; --marca:#F2643C; --tint-marca:#FEF3EE;
  --alerta-tint:#FDF3E1; --alerta-txt:#98600A;
  --erro-tint:#FCEBEB; --erro-txt:#971F25;
  --sombra-chip:inset 0 0 0 1px rgba(27,30,36,.09);
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --logo-claro:inline; --logo-escuro:none;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --papel:#15171C; --card:#1F2228; --alt:#282B32;
    --hairline:#2E313A; --forte:#3C4049;
    --tinta:#F4F1EC; --tinta-2:#BDB8B0; --tinta-3:#8E8981;
    --acao:#F2643C; --acao-forte:#F47F58; --marca:#F2643C; --tint-marca:#2A1B15;
    --alerta-tint:#2A2211; --alerta-txt:#F1BC6A;
    --erro-tint:#2B1517; --erro-txt:#F08D90;
    --sombra-chip:inset 0 0 0 1px rgba(244,241,236,.14);
    --logo-claro:none; --logo-escuro:inline;
  }
}
:root[data-theme="dark"]{
  --papel:#15171C; --card:#1F2228; --alt:#282B32;
  --hairline:#2E313A; --forte:#3C4049;
  --tinta:#F4F1EC; --tinta-2:#BDB8B0; --tinta-3:#8E8981;
  --acao:#F2643C; --acao-forte:#F47F58; --marca:#F2643C; --tint-marca:#2A1B15;
  --alerta-tint:#2A2211; --alerta-txt:#F1BC6A;
  --erro-tint:#2B1517; --erro-txt:#F08D90;
  --sombra-chip:inset 0 0 0 1px rgba(244,241,236,.14);
  --logo-claro:none; --logo-escuro:inline;
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--papel); color:var(--tinta);
  font-family:Sora,ui-sans-serif,system-ui,sans-serif; font-size:16px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
.pag{max-width:1080px; margin:0 auto; padding:0 24px 100px}
code,.hex{font-family:var(--mono); font-variant-numeric:tabular-nums}

/* ── topo ── */
header{padding:72px 0 0}
.logo{width:210px; height:auto; display:block}
.logo.claro{display:var(--logo-claro)} .logo.escuro{display:var(--logo-escuro)}
h1{
  font-size:clamp(34px,5.2vw,52px); line-height:1.08; font-weight:700;
  letter-spacing:-.03em; text-wrap:balance; margin:26px 0 0;
}
.lead{font-size:19px; line-height:1.55; color:var(--tinta-2); max-width:62ch; margin:18px 0 0}
.fonte{
  margin:30px 0 0; padding:18px 20px; background:var(--card);
  border:1px solid var(--hairline); border-radius:16px; max-width:62ch;
}
.fonte p{margin:0; font-size:14px; line-height:1.6; color:var(--tinta-2)}
.fonte p + p{margin-top:10px}
.fonte b{color:var(--tinta)}
.cmd{
  display:inline-block; font-family:var(--mono); font-size:13px;
  background:var(--alt); border-radius:8px; padding:2px 7px; color:var(--tinta)
}

/* ── seções ── */
section{margin-top:78px; scroll-margin-top:20px}
.eyebrow{
  font-size:12px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
  color:var(--acao); margin:0 0 10px;
}
h2{font-size:29px; line-height:1.15; font-weight:700; letter-spacing:-.02em; margin:0; text-wrap:balance}
h3{font-size:15px; font-weight:600; letter-spacing:.01em; margin:34px 0 14px; color:var(--tinta)}
.nota{font-size:15px; line-height:1.6; color:var(--tinta-2); max-width:66ch; margin:12px 0 0}

/* ── swatches ── */
.swgrid{display:grid; grid-template-columns:repeat(auto-fill,minmax(184px,1fr)); gap:10px; margin-top:14px}
.sw{display:flex; flex-direction:column; gap:8px}
.sw-chip{height:56px; border-radius:12px; box-shadow:var(--sombra-chip)}
.sw-txt{display:flex; flex-direction:column; gap:1px; font-size:12px}
.sw-txt code{font-size:12px; color:var(--tinta)}
.hex{color:var(--tinta-3); font-size:11.5px; text-transform:uppercase}
.uso{color:var(--tinta-3); font-size:11.5px; line-height:1.35}

/* ── tabelas ── */
.rolagem{overflow-x:auto; margin-top:14px}
table{border-collapse:collapse; width:100%; font-size:14px; min-width:520px}
th{
  text-align:left; font-size:11.5px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:var(--tinta-3); padding:0 14px 9px 0;
  border-bottom:1px solid var(--hairline); white-space:nowrap;
}
td{padding:11px 14px 11px 0; border-bottom:1px solid var(--hairline); vertical-align:top}
td code{font-size:13px}
tbody tr:last-child td{border-bottom:0}
.dim{color:var(--tinta-3)}

/* ── regras duras ── */
.regras{display:grid; grid-template-columns:repeat(auto-fit,minmax(232px,1fr)); gap:14px; margin-top:18px}
.regra{background:var(--card); border:1px solid var(--hairline); border-radius:16px; padding:18px 20px}
.regra b{display:block; font-size:15px; margin-bottom:6px}
.regra p{margin:0; font-size:13.5px; line-height:1.55; color:var(--tinta-2)}
.proibido{background:var(--erro-tint); border-color:transparent}
.proibido b{color:var(--erro-txt)}
.proibido p{color:var(--erro-txt); opacity:.86}

/* ── tipografia viva ── */
.tipo-linha{
  display:flex; align-items:baseline; gap:20px; padding:15px 0;
  border-bottom:1px solid var(--hairline); flex-wrap:wrap;
}
.tipo-linha:last-child{border-bottom:0}
.tipo-meta{flex:0 0 152px; font-family:var(--mono); font-size:11.5px; color:var(--tinta-3); line-height:1.5}
.tipo-meta b{display:block; color:var(--tinta); font-family:Sora; font-size:13px; font-weight:600}
.amostra{flex:1; min-width:220px}

/* ── raio: o momento visual ── */
.raio-tese{
  margin-top:20px; display:grid; grid-template-columns:minmax(0,220px) 1fr; gap:34px;
  align-items:center; background:var(--card); border:1px solid var(--hairline);
  border-radius:16px; padding:30px;
}
.simbolo{width:100%; max-width:190px; height:auto; display:block; margin:0 auto}
.raio-grid{display:flex; gap:12px; flex-wrap:wrap; margin-top:18px}
.raio-am{text-align:center; font-size:11px; color:var(--tinta-3); font-family:var(--mono)}
.raio-cx{width:62px; height:62px; background:var(--acao); margin-bottom:7px}

@media (max-width:720px){
  .raio-tese{grid-template-columns:1fr; gap:22px; padding:22px}
  .tipo-meta{flex-basis:100%}
}
</style>

<div class="pag">
<header>
  <img class="logo claro" alt="Legalizai" src="data:image/svg+xml;base64,${logoClaro}">
  <img class="logo escuro" alt="Legalizai" src="data:image/svg+xml;base64,${logoEscuro}">
  <h1>O design system</h1>
  <p class="lead">A fundação que vem antes das telas: cor, tipo, espaço, raio e motion valem
  pro produto inteiro. Componente só nasce quando uma tela pede.</p>
  <div class="fonte">
    <p><b>De onde isto sai.</b> Do repo <code>pedromberg-crypto/legalizei</code>, que é a fonte
    da verdade. O <code>legalizei-app</code> tem uma cópia mais velha do CSS, sem tema escuro.</p>
    <p><b>Componente renderizado</b> se confere no Storybook, nunca em documento:
    <span class="cmd">cd legalizei/app &amp;&amp; npm run storybook</span> → porta 6006.
    Documento que recria componente à mão diverge do código, e já divergiu duas vezes.</p>
    <p><b>No vault de vídeo</b> os tokens estão em <code>identidade/tokens.css</code>, em CSS puro,
    porque as peças de lá são HTML sem build. Esta página usa esses mesmos tokens.</p>
  </div>
</header>

<section>
  <p class="eyebrow">Cor · camada 1</p>
  <h2>Primitivos</h2>
  <p class="nota">Sistema de duas cores: coral carrega marca e ação, ink carrega seriedade e
  estrutura. Verde, âmbar e vermelho são só estado, nunca decoração. São privados: nenhuma tela
  usa um destes direto.</p>

  <h3>Coral · marca e ação</h3>
  <div class="swgrid">${coral.map(([n, h, u]) => swatch(n, h, u, '--p-coral-')).join('')}
  </div>

  <h3>Ink · texto, estrutura, base</h3>
  <div class="swgrid">${ink.map(([n, h, u]) => swatch(n, h, u, n === 'white' ? '--p-' : '--p-ink-')).join('')}
  </div>

  <h3>Estado · funcional, o estado do CNPJ</h3>
  <div class="rolagem">
    <table>
      <thead><tr><th>Papel</th><th>Tint</th><th>Base</th><th>Texto</th></tr></thead>
      <tbody>${estado.map(([label, nome, t, b, tx]) => `
        <tr>
          <td><b>${label}</b><br><span class="dim">${nome}</span></td>
          <td><code>${t}</code></td><td><code>${b}</code></td><td><code>${tx}</code></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</section>

<section>
  <p class="eyebrow">Cor · camada 2</p>
  <h2>Semânticos</h2>
  <p class="nota">A tela nunca escolhe uma cor: ela pede um papel. A separação entre as duas
  camadas é proposital. No app, só os semânticos entram no <code>@theme</code> do Tailwind, então
  só eles viram classe utilitária. <code>bg-coral-500</code> simplesmente não existe: o caminho
  errado não compila.</p>
  <div class="rolagem">
    <table>
      <thead><tr><th>Token</th><th>Aponta pra</th><th>Regra</th></tr></thead>
      <tbody>${semanticos.map(([t, p, r]) => `
        <tr><td><code>--color-${t}</code></td><td><code>${p}</code></td><td class="dim">${esc(r)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</section>

<section>
  <p class="eyebrow">O que não se negocia</p>
  <h2>As quatro regras duras</h2>
  <div class="regras">
    <div class="regra proibido"><b>Nenhuma tela toca primitivo</b>
      <p>Tela que escreve #F2643C é bug, não estilo.</p></div>
    <div class="regra proibido"><b>Coral nunca é erro</b>
      <p>Coral e vermelho são hues vizinhos. Erro é crimson mais ícone mais texto: a distinção
      vem da forma, não do matiz.</p></div>
    <div class="regra proibido"><b>text-muted nunca é leitura</b>
      <p>O ink-400 falha AA. Serve pra placeholder e disabled, e só.</p></div>
    <div class="regra proibido"><b>Azul nunca é marca</b>
      <p>O info-blue é funcional, de uso mínimo. Decisão de território.</p></div>
  </div>
  <p class="nota">Some a isso a regra de copy: <b>nada de travessão</b>, em nenhum texto público.
  Reescrever com ponto, vírgula, "e" ou frase separada.</p>
</section>

<section>
  <p class="eyebrow">Tipografia</p>
  <h2>Sora, o sistema inteiro</h2>
  <p class="nota">Não só o wordmark: display, títulos, corpo e UI. Foram sondadas e descartadas
  Fraunces, Bricolage Grotesque, Space Grotesk, Schibsted Grotesk e Instrument Serif. A escala
  é em <code>rem</code>, nunca px travado, porque fonte ampliável é requisito de acessibilidade.</p>
  ${escalaTipo.map(([n, px, lh, w, uso]) => `
  <div class="tipo-linha">
    <div class="tipo-meta"><b>text-${n}</b>${px} / ${lh} / ${w}<br>${esc(uso)}</div>
    <div class="amostra" style="font-size:${px}px;line-height:${lh};font-weight:${w}">
      Sua empresa está em dia
    </div>
  </div>`).join('')}
  <p class="nota"><b>O corpo é 16, não 17.</b> Decisão do Pedro em 16/07, contra a proposta de 17
  pelo nicho leigo. A consequência fica registrada: a acessibilidade passa a depender inteiramente
  da fonte ampliável. Se a persona idosa reclamar de leitura numa rodada futura, o suspeito é
  este número.</p>
</section>

<section>
  <p class="eyebrow">Geometria</p>
  <h2>O raio sai do logo</h2>
  <div class="raio-tese">
    <div>
      <svg class="simbolo" viewBox="0 0 122 122" role="img" aria-label="Símbolo Legalizai">
        <path fill="var(--marca)" d="M72.64,95.27c-6.56,6.56-17.21,6.56-23.77,0L13.91,60.32c7.6-7.6,19.93-7.6,27.54,0l19.31,19.31,60.67-60.67C121.28,8.46,112.74,0,102.21,0H19.23C8.61,0,0,8.61,0,19.23v82.98c0,10.62,8.61,19.23,19.23,19.23h82.98c10.62,0,19.23-8.61,19.23-19.23v-55.74l-48.8,48.8Z"/>
      </svg>
    </div>
    <div>
      <p class="nota" style="margin:0">O símbolo tem raio de aproximadamente <b>0,27 × o lado</b>.
      Num ícone de 44px isso dá 12. É de lá que vem o <code>radius-md</code> de input e botão,
      e é a régua do resto da escala. O logo governa o sistema, não o contrário.</p>
      <div class="raio-grid">${raios.map(([n, px]) => `
        <div class="raio-am">
          <div class="raio-cx" style="border-radius:${px === 999 ? '50%' : px + 'px'}"></div>${n} · ${px === 999 ? '999' : px}
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>

<section>
  <p class="eyebrow">Ritmo</p>
  <h2>Espaço, elevação e motion</h2>
  <div class="rolagem">
    <table>
      <thead><tr><th>Espaço</th><th>px</th><th>Uso</th></tr></thead>
      <tbody>${espacos.map(([n, px, uso]) => `
        <tr><td><code>space-${n}</code></td><td><code>${px}</code></td><td class="dim">${esc(uso)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <p class="nota">Base 4, uma densidade só. Compact e comfortable seriam aposta, então não existem.
  No app não há token novo pra isso de propósito: a escala nativa do Tailwind já é base 4 e bate
  exatamente, e duplicar seria o mesmo pecado que a fundação proíbe.</p>

  <h3>Elevação · sem sombra por padrão</h3>
  <p class="nota" style="margin-top:0">O fundo é papel quente, não branco. Card branco sobre papel
  mais borda hairline já separa, e é coerente com a metáfora. Sombra fica só pra sheet e modal,
  que precisam flutuar de verdade.</p>

  <h3>Motion</h3>
  <div class="rolagem">
    <table>
      <thead><tr><th>Token</th><th>Duração</th><th>Uso</th></tr></thead>
      <tbody>
        <tr><td><code>motion-micro</code></td><td><code>150ms</code></td><td class="dim">hover, toggle, foco</td></tr>
        <tr><td><code>motion-default</code></td><td><code>250ms</code></td><td class="dim">transição de tela, revelar campo</td></tr>
        <tr><td><code>motion-enter</code></td><td><code>400ms</code></td><td class="dim">entrada de conteúdo, Lottie</td></tr>
      </tbody>
    </table>
  </div>
  <p class="nota">Easing <code>ease-out</code>, e sempre respeitando <code>prefers-reduced-motion</code>.
  Ressalva honesta: estas durações ainda não são CSS var no app. São regra decidida, não tokenizada.</p>
</section>

<section>
  <p class="eyebrow">Estrutura</p>
  <h2>Dois shells e dez arquétipos</h2>
  <p class="nota">A coesão de app grande não vem de componente bonito. Vem, nesta ordem: a moldura
  não se mexe, o ritmo espacial, os tokens semânticos. O produto tem dois shells, e a casa nasce
  no pagamento. O teste que separa os dois: <b>casa é onde você vai ver o que aconteceu enquanto
  você não estava.</b> Antes disso nada acontece sem o usuário, então o wizard não tem espera,
  não tem nav e quase não tem estado.</p>
  <p class="nota">Os arquétipos não foram inventados, foram derivados: a pergunta certa não é
  "quais componentes preciso", é "quais situações se repetem".</p>
  <div class="rolagem">
    <table>
      <thead><tr><th>#</th><th>Arquétipo</th><th>Onde</th><th>Regra</th></tr></thead>
      <tbody>${arquetipos.map(([id, nome, onde, regra]) => `
        <tr><td><code>${id}</code></td><td><b>${esc(nome)}</b></td><td class="dim">${esc(onde)}</td><td class="dim">${esc(regra)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</section>

<section>
  <p class="eyebrow">Governança</p>
  <h2>Atrito mecânico</h2>
  <p class="nota">Governança de time é social; governança solo é mecânica. Ninguém revisa o Pedro
  às 23h de uma sexta com uma tela faltando, e é assim que toda dívida de design system solo
  nasce. Então a regra não pode depender de ele lembrar dela: <b>fazer a coisa errada precisa ser
  mais difícil que fazer a certa.</b> Se <code>#F2643C</code> não existe em lugar nenhum pra
  copiar, ninguém usa. O caminho curto vira o token por preguiça, não por disciplina.</p>
  <div class="regras">
    <div class="regra"><b>Regra dos três</b>
      <p>Apareceu nas duas telas-farol, promove agora. Numa só, fica local e espera. Na terceira
      ocorrência, promove. Duas é coincidência; três é padrão.</p></div>
    <div class="regra"><b>Nenhuma tela inventa componente</b>
      <p>Ou usa o que existe, ou promove conscientemente.</p></div>
    <div class="regra"><b>A métrica</b>
      <p>Valor hard-coded fora de token: zero. Componentes novos por tela: caindo. Se a nona tela
      custar o mesmo que a primeira, o sistema falhou.</p></div>
  </div>
</section>

<section>
  <p class="eyebrow">Referência</p>
  <h2>Onde mora o quê</h2>
  <div class="rolagem">
    <table>
      <thead><tr><th>Arquivo</th><th>O que é</th></tr></thead>
      <tbody>
        <tr><td><code>marca/identidade-visual/design-system.md</code></td><td class="dim">a fundação, este documento na origem</td></tr>
        <tr><td><code>marca/identidade-visual/paleta-cores.md</code></td><td class="dim">os primitivos de cor</td></tr>
        <tr><td><code>marca/decisoes-marca.md</code></td><td class="dim">o ADR, log de decisões travadas com data</td></tr>
        <tr><td><code>app/src/app/globals.css</code></td><td class="dim">o CSS real, as duas camadas e o tema escuro</td></tr>
        <tr><td><code>app/src/lib/telas-flow.ts</code></td><td class="dim">catálogo das 73 telas, fonte única do mockup</td></tr>
        <tr><td><code>identidade/tokens.css</code></td><td class="dim">no vault de vídeo: os tokens em CSS puro</td></tr>
      </tbody>
    </table>
  </div>
  <p class="nota">A marca é <b>Legalizai</b> com A desde 03/08/2026. O domínio registrado continua
  <code>legalizei.app</code>, que é o ativo pago: só o nome exibido mudou.</p>
</section>
</div>
`;

const destino = process.argv[2];
writeFileSync(destino, html);
console.log('escrito:', destino, '|', Math.round(Buffer.byteLength(html) / 1024), 'KB');
