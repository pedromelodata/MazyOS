// Prova de colisão de uma peça (kit.py colisao; 05/10/2026). Contrato do render: RM/src/kit/render/colisao.ts.
// Uso: node colisao.mjs <pasta da peça> [--cena <arquivo>] [--de <s>] [--ate <s>] [--passo <n>] [--saida <pasta>]
//                       [--concorrencia <n>]
// Lê as props<sufixo>.json e o bloco "colisao" da cena (tolerância, pares permitidos e as faixas; o das props, se um
// dia o montaProps copiar, fica por baixo), empacota o RM (rspack, public-kit), abre o chrome-headless-shell com
// --gl=angle e roda os quadros pedidos do KitMotion com props.prova.colisao pelo renderFrames com imageFormat "none":
// cada quadro é montado e testado no navegador, e nenhuma imagem é gravada. As linhas do console ([PROVA], [COLISAO],
// [CONTATO], [FAIXA], [SOBREPOE], [PROVA_ERRO]) voltam pelo onBrowserLog e viram <saida>/colisao<sufixo>.json e .md
// (padrão <peça>/qc/), gravados pelo escrita.mjs. Toque aparente: sobreposição na tela com folga na linha de visão
// abaixo de colisao.aparente (padrão 40 mm; false desliga); acima disso, até 10 cm, a sobreposição sai no relatório
// como camada.
// Guardas (como o stills.mjs): disco conferido antes do bundle e a cada 20 quadros (abaixo do limite, cancela; limite
// KIT_LIMITE_DISCO_MB, padrão 250 MB); no fim, e também no erro, apaga o bundle e as pastas do Temp que esta execução
// criou. Quem chama pelo kit.py roda dentro da trava de render, com o vigia de disco e um Temp próprio.
// Código de saída: 0 sem colisão, sem invasão de faixa e sem toque aparente; 1 com algum deles (o par permitido não
// conta), quadro sem prova ou erro; 2 uso errado; 3 disco abaixo do limite.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { makeCancelSignal, openBrowser, renderFrames, selectComposition } from "@remotion/renderer";
import { gravaJson, gravaTexto, livreMb } from "../lib/escrita.mjs";
import { ErroCli, PUBLIC_KIT, RM, argumentos, lePeca, leProps, principal } from "./_runtime.mjs";

const ENTRADA = path.join(RM, "src", "index.ts");
const BIN = path.join(RM, "bin"); // absoluto: relativo, o ffmpeg falha no quadro 0
const CH = "C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe";
const CHROMIUM = { gl: "angle" };
const TMP = os.tmpdir();
const PADROES_TEMP = [/^remotion-webpack-bundle-/, /^puppeteer_dev_chrome_profile-/, /^react-motion-render/, /^remotion-/];
const LIMITE = Number(process.env.KIT_LIMITE_DISCO_MB || 250);
const TOLERANCIA_PADRAO = 0.0006; // a mesma do render (colisao.ts)
// folga na linha de visão (metros) abaixo da qual a sobreposição na tela é toque aparente: calibrada na peça de 05/10
// (os cinco toques que o Pedro viu a olho ficam em 34 mm ou menos; as camadas de propósito, como o cartão flutuando na
// frente do aparelho com sombra, em 43 mm ou mais)
const APARENTE_PADRAO = 0.04;
const RX_LINHA = /^\[(PROVA|COLISAO|CONTATO|FAIXA|SOBREPOE|PROVA_ERRO)\] (\{.*\})\s*$/s;

class DiscoBaixo extends Error {}

// O Remotion ecoa no terminal todo console.log da página (o defaultOnLog dele compara o nível da mensagem com ele
// mesmo, então logLevel não cala): as linhas da prova, milhares, chegam pelo onBrowserLog, e o eco delas fica aqui.
const RX_ECO = /\[(PROVA|COLISAO|CONTATO|FAIXA|SOBREPOE|PROVA_ERRO)\] \{/;
for (const nome of ["log", "info", "debug", "warn", "error"]) {
  const original = console[nome].bind(console);
  console[nome] = (...args) => {
    if (args.some((a) => typeof a === "string" && RX_ECO.test(a))) return;
    original(...args);
  };
}

// ---------- argumentos ----------
const numero = (txt, nome) => {
  const v = Number(String(txt).replace(",", "."));
  if (!Number.isFinite(v) || v < 0) throw new ErroCli(`--${nome} pede um número >= 0 (recebido: ${txt})`, 2);
  return v;
};

/** o bloco "colisao" (props por baixo, cena por cima), conferido */
function confDe(cena, props) {
  const c = { ...((props && props.colisao) || {}), ...((cena && cena.colisao) || {}) };
  for (const k of Object.keys(c)) {
    if (k.charAt(0) === "_") delete c[k]; // _ajuda e afins
    else if (["tolerancia", "permitidos", "faixaLegenda", "faixaFecho", "aparente"].indexOf(k) < 0) throw new ErroCli(`colisao.${k}: campo desconhecido (tolerancia, permitidos, faixaLegenda, faixaFecho, aparente)`, 2);
  }
  if (c.aparente !== undefined && c.aparente !== false && !(typeof c.aparente === "number" && c.aparente >= 0)) {
    throw new ErroCli(`colisao.aparente: folga em metros (número >= 0) ou false (recebido: ${JSON.stringify(c.aparente)})`, 2);
  }
  if (c.tolerancia !== undefined && !(typeof c.tolerancia === "number" && c.tolerancia >= 0)) throw new ErroCli(`colisao.tolerancia: número >= 0 em metros (recebido: ${JSON.stringify(c.tolerancia)})`, 2);
  if (c.permitidos !== undefined) {
    if (!Array.isArray(c.permitidos) || !c.permitidos.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === "string" && x))) {
      throw new ErroCli(`colisao.permitidos: lista de pares de ids de corpo, como [["carimbo", "pilhaA"]] (recebido: ${JSON.stringify(c.permitidos)})`, 2);
    }
  }
  for (const k of ["faixaLegenda", "faixaFecho"]) if (c[k] !== undefined && typeof c[k] !== "boolean") throw new ErroCli(`colisao.${k}: true ou false`, 2);
  return {
    tolerancia: typeof c.tolerancia === "number" ? c.tolerancia : TOLERANCIA_PADRAO,
    permitidos: c.permitidos || [],
    faixaLegenda: c.faixaLegenda !== false,
    faixaFecho: c.faixaFecho !== false,
    aparente: c.aparente === false ? false : typeof c.aparente === "number" ? c.aparente : APARENTE_PADRAO,
  };
}

// ---------- Temp (o mesmo cuidado do stills.mjs) ----------
const antes = new Set(fs.readdirSync(TMP).filter((n) => PADROES_TEMP.some((p) => p.test(n))));
const inicio = Date.now();

function apagaComEspera(alvo) {
  for (let i = 0; i < 20; i++) {
    try {
      fs.rmSync(alvo, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      if (!fs.existsSync(alvo)) return true;
    } catch {
      // arquivo preso: espera e tenta de novo
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  return !fs.existsSync(alvo);
}

function limpaTemp(serveUrl) {
  const apagados = [];
  if (serveUrl) {
    const s = path.resolve(serveUrl);
    if (path.dirname(s).toLowerCase() === path.resolve(TMP).toLowerCase() && /^remotion-webpack-bundle-/.test(path.basename(s))) {
      if (apagaComEspera(s)) apagados.push(path.basename(s));
    }
  }
  for (const n of fs.readdirSync(TMP)) {
    if (antes.has(n) || !PADROES_TEMP.some((p) => p.test(n))) continue;
    const alvo = path.join(TMP, n);
    try {
      const st = fs.statSync(alvo);
      if (st.mtimeMs + 5000 < inicio && st.birthtimeMs + 5000 < inicio) continue; // não foi criado agora
    } catch {
      continue; // já sumiu
    }
    if (apagaComEspera(alvo)) apagados.push(n);
    else console.error(`não consegui apagar ${alvo} (preso); apague depois`);
  }
  return apagados;
}

// ---------- junta as linhas do navegador ----------
function novoColetor() {
  const c = { quadros: new Map(), colisoes: new Map(), contatos: new Map(), faixas: new Map(), sobre: new Map(), erros: new Map(), ilegiveis: 0, avisos: new Map() };
  c.onBrowserLog = (log) => {
    const texto = String(log && log.text !== undefined ? log.text : "");
    const m = RX_LINHA.exec(texto);
    if (!m) {
      if (log && log.type === "error") {
        const k = texto.slice(0, 300);
        c.avisos.set(k, (c.avisos.get(k) || 0) + 1);
      }
      return;
    }
    let d;
    try {
      d = JSON.parse(m[2]);
    } catch {
      c.ilegiveis++;
      return;
    }
    if (typeof d.q !== "number") {
      c.ilegiveis++;
      return;
    }
    // o Remotion entrega a mesma linha mais de uma vez (Log e Runtime): a chave tira a repetição
    if (m[1] === "PROVA") c.quadros.set(d.q, d);
    else if (m[1] === "COLISAO") c.colisoes.set(`${d.q}|${d.a}|${d.b}`, d);
    else if (m[1] === "CONTATO") c.contatos.set(`${d.q}|${d.a}|${d.b}`, d);
    else if (m[1] === "FAIXA") c.faixas.set(`${d.q}|${d.corpo}|${d.zona}`, d);
    else if (m[1] === "SOBREPOE") c.sobre.set(`${d.q}|${d.a}|${d.b}`, d);
    else c.erros.set(d.q, d);
  };
  return c;
}

/** quadros em intervalos (vizinhos no passo da prova ficam juntos) */
function intervalos(qs, passo) {
  const s = Array.from(new Set(qs)).sort((a, b) => a - b);
  const out = [];
  for (const q of s) {
    const u = out[out.length - 1];
    if (u && q - u[1] <= passo) u[1] = q;
    else out.push([q, q]);
  }
  return out;
}

const seg = (q, fps) => Math.round((q / fps) * 100) / 100;
const mm = (m) => Math.round(m * 1e5) / 100; // metros em mm com 2 casas
const virg = (x) => String(x).replace(".", ",");
const textoIntervalos = (iv, fps) =>
  iv.map(([a, b]) => (a === b ? `q ${a} (${virg(seg(a, fps))} s)` : `q ${a} a ${b} (${virg(seg(a, fps))} a ${virg(seg(b, fps))} s)`)).join("; ");

/** os pares de corpos: quadros (não permitidos e permitidos), profundidade máxima, o pior quadro */
function juntaPares(colisoes, passo, fps) {
  const pares = new Map();
  for (const d of colisoes.values()) {
    const k = `${d.a}|${d.b}`;
    let p = pares.get(k);
    if (!p) {
      p = { a: d.a, b: d.b, quadros: [], quadrosPermitidos: [], permitidoPor: [], profMax: 0, pior: null, profMaxPermitido: 0 };
      pares.set(k, p);
    }
    if (d.permitido) {
      p.quadrosPermitidos.push(d.q);
      if (p.permitidoPor.indexOf(d.permitido) < 0) p.permitidoPor.push(d.permitido);
      if (d.prof > p.profMaxPermitido) p.profMaxPermitido = d.prof;
      continue;
    }
    p.quadros.push(d.q);
    if (!p.pior || d.prof > p.profMax) {
      p.profMax = d.prof;
      p.pior = { q: d.q, s: seg(d.q, fps), prof: d.prof, profMm: mm(d.prof), tipo: d.tipo, malhas: d.malhas, px: d.px };
    }
  }
  return Array.from(pares.values()).map((p) => ({
    a: p.a,
    b: p.b,
    quadros: p.quadros.length,
    intervalos: intervalos(p.quadros, passo).map(([x, y]) => ({ de: x, ate: y, deS: seg(x, fps), ateS: seg(y, fps) })),
    profMax: p.profMax,
    profMaxMm: mm(p.profMax),
    pior: p.pior,
    quadrosPermitidos: p.quadrosPermitidos.length,
    intervalosPermitidos: intervalos(p.quadrosPermitidos, passo).map(([x, y]) => ({ de: x, ate: y, deS: seg(x, fps), ateS: seg(y, fps) })),
    permitidoPor: p.permitidoPor,
    profMaxPermitidoMm: mm(p.profMaxPermitido),
  })).sort((x, y) => (y.quadros > 0) - (x.quadros > 0) || y.profMax - x.profMax || (x.a + x.b < y.a + y.b ? -1 : 1));
}

function juntaContatos(contatos, passo, fps) {
  const m = new Map();
  for (const d of contatos.values()) {
    const k = `${d.a}|${d.b}`;
    const p = m.get(k) || { a: d.a, b: d.b, qs: [], profMax: 0 };
    p.qs.push(d.q);
    if (d.prof > p.profMax) p.profMax = d.prof;
    m.set(k, p);
  }
  return Array.from(m.values()).map((p) => ({
    a: p.a, b: p.b, quadros: p.qs.length, profMaxMm: mm(p.profMax),
    intervalos: intervalos(p.qs, passo).map(([x, y]) => ({ de: x, ate: y, deS: seg(x, fps), ateS: seg(y, fps) })),
  })).sort((x, y) => y.quadros - x.quadros);
}

function juntaFaixas(faixas, passo, fps) {
  const m = new Map();
  for (const d of faixas.values()) {
    const k = `${d.corpo}|${d.zona}`;
    const inv = Math.min(d.invade[0], d.invade[1]);
    const p = m.get(k) || { corpo: d.corpo, zona: d.zona, qs: [], invMax: 0, pior: null };
    p.qs.push(d.q);
    if (!p.pior || inv > p.invMax) {
      p.invMax = inv;
      p.pior = { q: d.q, s: seg(d.q, fps), ret: d.ret, invade: d.invade };
    }
    m.set(k, p);
  }
  return Array.from(m.values()).map((p) => ({
    corpo: p.corpo, zona: p.zona, quadros: p.qs.length, invasaoMaxPx: p.invMax, pior: p.pior,
    intervalos: intervalos(p.qs, passo).map(([x, y]) => ({ de: x, ate: y, deS: seg(x, fps), ateS: seg(y, fps) })),
  })).sort((x, y) => y.invasaoMaxPx - x.invasaoMaxPx);
}

/** sobreposições na tela por par: os quadros de toque aparente (folga abaixo do limiar) e os de camada (acima) */
function juntaSobre(sobre, passo, fps, limiar) {
  const m = new Map();
  const iv = (qs) => intervalos(qs, passo).map(([x, y]) => ({ de: x, ate: y, deS: seg(x, fps), ateS: seg(y, fps) }));
  for (const d of sobre.values()) {
    const k = `${d.a}|${d.b}`;
    const p = m.get(k) || { a: d.a, b: d.b, toque: [], camada: [], folgaMin: Infinity, folgaMinCamada: Infinity, areaMax: 0, pior: null };
    if (limiar !== false && d.folga < limiar) p.toque.push(d.q);
    else {
      p.camada.push(d.q);
      if (d.folga < p.folgaMinCamada) p.folgaMinCamada = d.folga;
    }
    if (d.area > p.areaMax) p.areaMax = d.area;
    if (d.folga < p.folgaMin) {
      p.folgaMin = d.folga;
      p.pior = { q: d.q, s: seg(d.q, fps), folgaMm: mm(d.folga), area: d.area, frente: d.frente, px: d.px };
    }
    m.set(k, p);
  }
  return Array.from(m.values()).map((p) => ({
    a: p.a, b: p.b, toque: p.toque.length > 0, quadrosToque: p.toque.length, quadrosCamada: p.camada.length,
    intervalosToque: iv(p.toque), intervalosCamada: iv(p.camada), folgaMinMm: mm(p.folgaMin),
    folgaMinCamadaMm: p.camada.length ? mm(p.folgaMinCamada) : null, areaMaxPx: p.areaMax, pior: p.pior,
  })).sort((x, y) => (y.toque ? 1 : 0) - (x.toque ? 1 : 0) || x.folgaMinMm - y.folgaMinMm);
}

// ---------- relatório em texto ----------
function relatorioMd(r) {
  const L = [];
  const fps = r.fps;
  const iv = (lista) => textoIntervalos(lista.map((x) => [x.de, x.ate]), fps);
  L.push(`# Prova de colisão: ${r.peca}${r.sufixo}`);
  L.push("");
  L.push(`Gerado em ${r.geradoEm} pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).`);
  L.push("");
  L.push(`**Resultado: ${r.ok ? "ZERO colisão" : "COM COLISÃO"}.** ${r.resumo}`);
  L.push("");
  L.push("## Parâmetros");
  L.push("");
  L.push(`- Quadros testados: ${r.quadrosTestados} de ${r.quadrosPedidos} pedidos (q ${r.de} a ${r.ate}, passo ${r.passo}; ${fps} fps; o vídeo tem ${r.total} quadros).`);
  L.push(`- Tolerância: ${virg(mm(r.conf.tolerancia))} mm (até aqui é encostar, não colidir).`);
  L.push(`- Pares permitidos pela cena: ${r.conf.permitidos.length ? r.conf.permitidos.map((p) => `${p[0]} x ${p[1]}`).join(", ") : "nenhum"}.`);
  L.push(`- Faixa da legenda: ${r.conf.faixaLegenda ? "conferida" : "desligada na cena"}; fecho e link: ${r.conf.faixaFecho ? "conferidos" : "desligados na cena"}.`);
  L.push(`- Toque aparente: ${r.conf.aparente === false ? "desligado na cena" : `folga na linha de visão abaixo de ${virg(mm(r.conf.aparente))} mm com as silhuetas se cobrindo na tela conta`}.`);
  L.push(`- Tempo: ${virg(r.tempo.totalS)} s no total (bundle ${virg(r.tempo.bundleS)} s, quadros ${virg(r.tempo.quadrosS)} s, ${virg(r.tempo.msPorQuadro)} ms por quadro com ${r.concorrencia} aba(s); a prova em si, ${virg(r.tempo.provaMsMedia)} ms por quadro em média, ${virg(r.tempo.provaMsMax)} ms no pior).`);
  L.push("");
  L.push("## Colisões 3D (corpo entrando em outro)");
  L.push("");
  const contam = r.pares.filter((p) => p.quadros > 0);
  if (!contam.length) L.push("Nenhuma.");
  else {
    L.push("| corpos | quadros | prof. máx. | pior quadro | onde (px) | malhas no pior |");
    L.push("|---|---|---|---|---|---|");
    for (const p of contam) {
      const w = p.pior;
      L.push(`| ${p.a} x ${p.b} | ${iv(p.intervalos)} | ${virg(p.profMaxMm)} mm | q ${w.q} (${virg(w.s)} s), ${w.tipo === "dentro" ? "um dentro do outro" : "superfícies se cruzam"} | ${w.px ? `${Math.round(w.px[0])}, ${Math.round(w.px[1])}` : "?"} | ${(w.malhas || []).join(" x ")} |`);
    }
  }
  L.push("");
  L.push("A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.");
  L.push("");
  const perm = r.pares.filter((p) => p.quadrosPermitidos > 0);
  if (perm.length) {
    L.push("## Contatos permitidos (não contam)");
    L.push("");
    for (const p of perm) L.push(`- ${p.a} x ${p.b} (${p.permitidoPor.join(", ")}): ${iv(p.intervalosPermitidos)}; até ${virg(p.profMaxPermitidoMm)} mm.`);
    L.push("");
  }
  L.push("## Faixas 2D (corpo 3D na legenda, no fecho ou no link)");
  L.push("");
  if (!r.faixas.length) L.push("Nenhuma invasão.");
  else {
    L.push("| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |");
    L.push("|---|---|---|---|---|---|");
    for (const f of r.faixas) {
      const w = f.pior;
      L.push(`| ${f.corpo} | ${f.zona} | ${iv(f.intervalos)} | ${virg(Math.round(f.invasaoMaxPx))} px | q ${w.q} (${virg(w.s)} s) | x ${Math.round(w.ret[0])} a ${Math.round(w.ret[2])}, y ${Math.round(w.ret[1])} a ${Math.round(w.ret[3])} |`);
    }
    L.push("");
    L.push("Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho (\"Vai,\" e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.");
  }
  L.push("");
  if (r.conf.aparente !== false) {
    L.push("## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)");
    L.push("");
    const toques = r.sobre.filter((p) => p.toque);
    if (!toques.length) L.push("Nenhum.");
    else {
      L.push("| corpos | quadros | folga mín. | pior quadro | na frente | onde (px) | área máx. em comum |");
      L.push("|---|---|---|---|---|---|---|");
      for (const p of toques) {
        const w = p.pior;
        L.push(`| ${p.a} x ${p.b} | ${iv(p.intervalosToque)} | ${virg(w.folgaMm)} mm | q ${w.q} (${virg(w.s)} s) | ${w.frente} | ${w.px ? `${Math.round(w.px[0])}, ${Math.round(w.px[1])}` : "?"} | ${p.areaMaxPx} px² |`);
      }
      L.push("");
      L.push("De frente, a câmera não mostra a folga: a borda de um some atrás do outro e a junção lê como um entrando no outro. Conserto: afastar na tela (sem se cobrirem), afastar em profundidade além do limiar, ou encostar de verdade (com `encostaEm` ou `permitidos`, se o contato for de propósito).");
    }
    const camadas = r.sobre.filter((p) => p.quadrosCamada > 0);
    if (camadas.length) {
      L.push("");
      L.push(`Sobreposições com folga de ${virg(mm(r.conf.aparente))} mm a 10 cm (camada, não contam; pra revisar a olho):`);
      L.push("");
      for (const p of camadas.slice(0, 40)) L.push(`- ${p.a} x ${p.b}: ${iv(p.intervalosCamada.slice(0, 6))}${p.intervalosCamada.length > 6 ? "; ..." : ""}; folga mínima nesses quadros ${virg(p.folgaMinCamadaMm)} mm.`);
      if (camadas.length > 40) L.push(`- ... mais ${camadas.length - 40} par(es) no JSON.`);
    }
    L.push("");
  }
  if (r.contatos.length) {
    L.push("## Encostam até a tolerância (não contam)");
    L.push("");
    for (const c of r.contatos.slice(0, 30)) L.push(`- ${c.a} x ${c.b}: ${c.quadros} quadro(s), até ${virg(c.profMaxMm)} mm (${iv(c.intervalos.slice(0, 6))}${c.intervalos.length > 6 ? "; ..." : ""}).`);
    if (r.contatos.length > 30) L.push(`- ... mais ${r.contatos.length - 30} par(es) no JSON.`);
    L.push("");
  }
  if (r.problemas.length) {
    L.push("## Problemas da prova");
    L.push("");
    for (const p of r.problemas) L.push(`- ${p}`);
    L.push("");
  }
  L.push("## Como ler e consertar");
  L.push("");
  L.push("- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; \"onde\" é o meio dos pontos de cruzamento visíveis, em px do quadro.");
  L.push("- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `\"colisao\": {\"permitidos\": [[\"a\", \"b\"]]}` na cena.");
  L.push("- `\"colisao\": {\"tolerancia\": 0.0006, \"faixaLegenda\": true, \"faixaFecho\": true, \"aparente\": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.");
  L.push("");
  return L.join("\n") + "\n";
}

// ---------- principal ----------
await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2), { opcoes: ["de", "ate", "passo", "saida", "concorrencia"] });
  if (pos.length !== 1) throw new ErroCli("uso: node colisao.mjs <pasta da peça> [--cena <arquivo>] [--de <s>] [--ate <s>] [--passo <n>] [--saida <pasta>] [--concorrencia <n>]", 2);
  const peca = lePeca(pos[0], op.cena);
  const { props, caminho, avisos } = leProps(peca);
  for (const a of avisos) console.log(`AVISO: ${a}`);
  const conf = confDe(peca.cena, props);
  const fps = props.fps || 30;
  const total = props.quadros;
  if (!(total > 0)) throw new ErroCli(`as props não têm "quadros": ${caminho}`, 2);
  const passo = op.passo !== undefined ? Math.max(1, Math.round(numero(op.passo, "passo"))) : 1;
  const de = Math.min(total - 1, Math.max(0, Math.round((op.de !== undefined ? numero(op.de, "de") : 0) * fps)));
  const ate = op.ate !== undefined ? Math.min(total - 1, Math.floor(numero(op.ate, "ate") * fps + 1e-6)) : total - 1;
  if (ate < de) throw new ErroCli(`trecho vazio: --de ${op.de} --ate ${op.ate}`, 2);
  const quadros = [];
  for (let q = de; q <= ate; q += passo) quadros.push(q);
  const concorrencia = op.concorrencia !== undefined ? Math.max(1, Math.round(numero(op.concorrencia, "concorrencia"))) : 3;
  const pastaSaida = op.saida ? path.resolve(op.saida) : path.join(peca.pasta, "qc");
  const arqJson = path.join(pastaSaida, `colisao${peca.sufixo}.json`);
  const arqMd = path.join(pastaSaida, `colisao${peca.sufixo}.md`);
  const inputProps = { ...props, prova: { colisao: conf } };
  console.log(`prova de colisão: ${peca.nome}${peca.sufixo}, ${quadros.length} quadro(s) (q ${de} a ${ate}, passo ${passo}), tolerância ${mm(conf.tolerancia)} mm, ${concorrencia} aba(s)`);

  let serveUrl = null;
  let browser = null;
  let codigo = 0;
  const col = novoColetor();
  const { cancelSignal, cancel } = makeCancelSignal();
  let discoBaixo = null;
  const interrompe = (sinal) => {
    console.error(`interrompido (${sinal}): limpando o Temp`);
    try {
      if (browser) browser.close({ silent: true });
    } catch {
      // nada
    }
    limpaTemp(serveUrl);
    process.exit(130);
  };
  process.on("SIGINT", () => interrompe("SIGINT"));
  process.on("SIGTERM", () => interrompe("SIGTERM"));
  const tempo = { bundleS: 0, quadrosS: 0 };
  try {
    const livre0 = livreMb();
    if (livre0 < LIMITE) throw new DiscoBaixo(`disco: ${livre0.toFixed(0)} MB livres no C: (limite ${LIMITE} MB) antes do bundle; parei`);
    const t0 = Date.now();
    serveUrl = await bundle({ entryPoint: ENTRADA, publicDir: PUBLIC_KIT, rspack: true, enableCaching: false, onProgress: () => undefined });
    tempo.bundleS = (Date.now() - t0) / 1000;
    console.log(`bundle pronto em ${tempo.bundleS.toFixed(1)} s (rspack, public ${PUBLIC_KIT})`);
    // logLevel "error": só erro do Remotion no terminal (o eco do console da página sai pelo filtro lá em cima)
    browser =await openBrowser("chrome", { browserExecutable: CH, chromiumOptions: CHROMIUM, logLevel: "error" });
    const composition = await selectComposition({ serveUrl, id: "KitMotion", inputProps, puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions: CHROMIUM, onBrowserLog: col.onBrowserLog, logLevel: "error" });
    const t1 = Date.now();
    let feitos = 0;
    await renderFrames({
      composition, serveUrl, inputProps, frames: quadros, imageFormat: "none", outputDir: null, concurrency: concorrencia,
      puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions: CHROMIUM,
      onBrowserLog: col.onBrowserLog, cancelSignal, timeoutInMilliseconds: 120000, muted: true, logLevel: "error",
      onStart: () => undefined,
      onFrameUpdate: (n) => {
        feitos = n;
        if (n % 20 === 0 || n === quadros.length) {
          const livre = livreMb();
          if (livre < LIMITE && !discoBaixo) {
            discoBaixo = `disco: ${livre.toFixed(0)} MB livres no C: (limite ${LIMITE} MB) no quadro ${n} de ${quadros.length}; parei`;
            cancel();
          }
          if (n % 100 === 0 || n === quadros.length) console.log(`${n}/${quadros.length} quadros (${((Date.now() - t1) / 1000).toFixed(0)} s, ${livre.toFixed(0)} MB livres)`);
        }
      },
    });
    tempo.quadrosS = (Date.now() - t1) / 1000;
    if (discoBaixo) throw new DiscoBaixo(discoBaixo);
    if (feitos < quadros.length) console.log(`AVISO: o renderFrames contou ${feitos} de ${quadros.length} quadros`);
  } catch (e) {
    codigo = e instanceof DiscoBaixo || discoBaixo ? 3 : 1;
    console.error(`ERRO: ${discoBaixo || (e && e.stack ? e.stack : e)}`);
  } finally {
    try {
      if (browser) await browser.close({ silent: true });
    } catch {
      // o navegador pode já ter caído
    }
    const apagados = limpaTemp(serveUrl);
    console.log(`Temp limpo: ${apagados.length} pasta(s); disco ${livreMb().toFixed(0)} MB livres`);
  }
  if (codigo !== 0) return codigo;

  // ---------- junta e grava ----------
  const testados = quadros.filter((q) => col.quadros.has(q));
  const faltam = quadros.filter((q) => !col.quadros.has(q));
  const pares = juntaPares(col.colisoes, passo, fps);
  const faixas = juntaFaixas(col.faixas, passo, fps);
  const contatos = juntaContatos(col.contatos, passo, fps);
  const sobre = juntaSobre(col.sobre, passo, fps, conf.aparente);
  const toques = sobre.filter((p) => p.toque);
  const problemas = [];
  if (faltam.length) problemas.push(`${faltam.length} quadro(s) sem a linha [PROVA] (o teste não rodou neles): ${textoIntervalos(intervalos(faltam, passo), fps)}`);
  if (col.erros.size) {
    const ex = Array.from(col.erros.values()).slice(0, 5).map((e) => `q ${e.q}: ${e.erro}`);
    problemas.push(`${col.erros.size} quadro(s) com erro na prova: ${ex.join("; ")}`);
  }
  if (col.ilegiveis) problemas.push(`${col.ilegiveis} linha(s) do console ilegíveis`);
  const nColisao = pares.filter((p) => p.quadros > 0).length;
  const quadrosComColisao = new Set(Array.from(col.colisoes.values()).filter((d) => !d.permitido).map((d) => d.q)).size;
  const quadrosComFaixa = new Set(Array.from(col.faixas.values()).map((d) => d.q)).size;
  const quadrosComToque = conf.aparente === false ? 0 : new Set(Array.from(col.sobre.values()).filter((d) => d.folga < conf.aparente).map((d) => d.q)).size;
  const ok = nColisao === 0 && faixas.length === 0 && toques.length === 0 && problemas.length === 0;
  const msProva = Array.from(col.quadros.values()).map((d) => Number(d.ms) || 0);
  const resumo = [
    `${nColisao} par(es) de corpos se cruzando em ${quadrosComColisao} quadro(s)`,
    `${faixas.length} invasão(ões) de faixa em ${quadrosComFaixa} quadro(s)`,
    conf.aparente === false ? "toque aparente desligado" : `${toques.length} toque(s) aparente(s) em ${quadrosComToque} quadro(s)`,
    problemas.length ? `${problemas.length} problema(s) da prova` : null,
  ].filter(Boolean).join("; ") + ".";
  const totalS = (Date.now() - inicio) / 1000;
  const r = {
    versao: 1,
    geradoEm: new Date().toISOString(),
    peca: peca.nome,
    sufixo: peca.sufixo,
    cena: path.basename(peca.caminhoCena),
    props: path.basename(caminho),
    ok,
    resumo,
    fps,
    total,
    de,
    ate,
    passo,
    concorrencia,
    quadrosPedidos: quadros.length,
    quadrosTestados: testados.length,
    conf,
    tempo: {
      totalS: Math.round(totalS * 10) / 10,
      bundleS: Math.round(tempo.bundleS * 10) / 10,
      quadrosS: Math.round(tempo.quadrosS * 10) / 10,
      msPorQuadro: quadros.length ? Math.round((tempo.quadrosS * 1000) / quadros.length) : 0,
      provaMsMedia: msProva.length ? Math.round((msProva.reduce((a, b) => a + b, 0) / msProva.length) * 10) / 10 : 0,
      provaMsMax: msProva.length ? Math.max(...msProva) : 0,
    },
    pares,
    faixas,
    sobre,
    contatos,
    problemas,
    quadrosSemProva: faltam,
    errosNavegador: Array.from(col.avisos.entries()).slice(0, 20).map(([texto, vezes]) => ({ texto, vezes })),
    // as linhas de cada quadro (as 5000 primeiras de cada tipo: o JSON fica pequeno)
    linhas: {
      colisoes: Array.from(col.colisoes.values()).sort((a, b) => a.q - b.q).slice(0, 5000),
      faixas: Array.from(col.faixas.values()).sort((a, b) => a.q - b.q).slice(0, 5000),
    },
  };
  gravaJson(arqJson, r, { criaPasta: true });
  gravaTexto(arqMd, relatorioMd(r), { criaPasta: true });
  console.log(`${ok ? "ZERO colisão" : "COM COLISÃO"}: ${resumo}`);
  for (const p of pares.filter((x) => x.quadros > 0)) {
    console.log(`  ${p.a} x ${p.b}: ${textoIntervalos(p.intervalos.map((x) => [x.de, x.ate]), fps)}; até ${p.profMaxMm} mm (pior q ${p.pior.q})`);
  }
  for (const f of faixas) console.log(`  faixa ${f.zona}: ${f.corpo} em ${textoIntervalos(f.intervalos.map((x) => [x.de, x.ate]), fps)}; até ${Math.round(f.invasaoMaxPx)} px`);
  for (const p of toques) console.log(`  toque aparente ${p.a} x ${p.b}: ${textoIntervalos(p.intervalosToque.map((x) => [x.de, x.ate]), fps)}; folga mínima ${p.folgaMinMm} mm (q ${p.pior.q}, na frente: ${p.pior.frente})`);
  for (const p of problemas) console.log(`  PROBLEMA: ${p}`);
  console.log(`gravado: ${arqJson}`);
  console.log(`gravado: ${arqMd}`);
  console.log(`tempo: ${r.tempo.totalS} s (bundle ${r.tempo.bundleS} s, quadros ${r.tempo.quadrosS} s)`);
  return ok ? 0 : 1;
});
