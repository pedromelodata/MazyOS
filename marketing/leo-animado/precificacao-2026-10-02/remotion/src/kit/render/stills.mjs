// Stills do kit pela API do Node (dono K06; contrato: KIT/DESENHO.md, seções 4.11, 7.1 e 7.4).
// Um bundle e um navegador por execução, com várias composições no mesmo bundle (GuiaPronta sem props e
// KitMotion com props, por exemplo). Só caminhos absolutos.
//
// Uso: node stills.mjs <trabalhos.json>
// trabalhos.json:
// {
//   "publicDir": "<pasta public absoluta>",            (public-kit, public-guia, um public temporário...)
//   "saida": "<pasta absoluta dos PNG>",
//   "trabalhos": [
//     { "composicao": "KitMotion", "props": {...} ou "<arquivo .json absoluto>" ou null,
//       "quadros": [0, 12, 24], "prefixo": "kit-", "saida": "<opcional: pasta deste trabalho>",
//       "foraDoLote": false }
//   ],
//   "lote": { "tamanho": 10, "depois": ["<exe>", "<arg>", ...], "apaga": true },   (opcional)
//   "listaComposicoes": false,        (opcional: grava as ids de getCompositions no log)
//   "logs": "<arquivo .json absoluto>",   (opcional; padrão <saida>/logs-navegador.json)
//   "limiteDiscoMb": 250              (opcional; KIT_LIMITE_DISCO_MB também vale)
// }
// Com "lote", os quadros de cada trabalho vão em lotes do tamanho dado (todos os trabalhos do lote juntos);
// depois de cada lote roda "depois" com o manifesto do lote no último argumento e, com "apaga", apaga os PNG do
// lote antes do próximo (pra não lotar o disco). Trabalhos "foraDoLote" rodam antes dos lotes, inteiros.
// Guardas: confere o disco antes de cada quadro (fs.statfsSync) e aborta abaixo do limite (250 MB); no fim, e
// também no erro, apaga o bundle e as pastas do Temp que esta execução criou (perfis do Chrome,
// remotion-webpack-bundle-*, remotion-* e react-motion-render*). O webpack cache fica desligado (nada em
// node_modules). O log do navegador (console.log da página, como o CAIXA_MEDIDA do KitProvaModelo) vai pro JSON.
// Código de saída: 0 ok, 1 erro, 2 uso errado, 3 disco abaixo do limite.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { CHROME, gravaJson, livreMb, protegidoMotivo } from "../lib/escrita.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RM = path.resolve(AQUI, "../../..");
const ENTRADA = path.join(RM, "src", "index.ts");
const BIN = path.join(RM, "bin"); // absoluto: relativo, o ffmpeg falha no quadro 0
const CH = CHROME;
const CHROMIUM = { gl: "angle" };
const TMP = os.tmpdir();
const PADROES_TEMP = [/^remotion-webpack-bundle-/, /^puppeteer_dev_chrome_profile-/, /^react-motion-render/, /^remotion-/];

class DiscoBaixo extends Error {}

const sair = (codigo, msg) => {
  if (msg) console.error(msg);
  process.exit(codigo);
};

const absoluto = (p, nome) => {
  if (typeof p !== "string" || !path.isAbsolute(p)) sair(2, `uso: ${nome} precisa ser caminho absoluto (recebido: ${JSON.stringify(p)})`);
  return path.resolve(p);
};

const arqTrabalhos = process.argv[2];
if (!arqTrabalhos) sair(2, "uso: node stills.mjs <trabalhos.json>");
const cfg = JSON.parse(fs.readFileSync(absoluto(arqTrabalhos, "trabalhos.json"), "utf8"));
const publicDir = absoluto(cfg.publicDir, "publicDir");
const saidaGeral = absoluto(cfg.saida, "saida");
if (!fs.existsSync(publicDir)) sair(2, `publicDir não existe: ${publicDir}`);
const LIMITE = Number(process.env.KIT_LIMITE_DISCO_MB || cfg.limiteDiscoMb || 250);
const arqLogs = cfg.logs ? absoluto(cfg.logs, "logs") : path.join(saidaGeral, "logs-navegador.json");

const trabalhos = (cfg.trabalhos || []).map((tr, i) => {
  if (!tr.composicao) sair(2, `trabalhos[${i}]: falta composicao`);
  let props = tr.props === undefined || tr.props === null ? {} : tr.props;
  if (typeof props === "string") props = JSON.parse(fs.readFileSync(absoluto(props, `trabalhos[${i}].props`), "utf8"));
  const saida = tr.saida ? absoluto(tr.saida, `trabalhos[${i}].saida`) : saidaGeral;
  const motivo = protegidoMotivo(saida);
  if (motivo) sair(2, `trabalhos[${i}]: a saída ${saida} é caminho protegido (${motivo})`);
  return {
    composicao: tr.composicao,
    props,
    quadros: (tr.quadros || [0]).map(Number),
    prefixo: tr.prefixo === undefined ? `${tr.composicao}-` : String(tr.prefixo),
    saida,
    foraDoLote: !!tr.foraDoLote,
  };
});
if (!trabalhos.length) sair(2, "nenhum trabalho");

// ---------- Temp: o que já existia antes desta execução ----------
const antes = new Set(fs.readdirSync(TMP).filter((n) => PADROES_TEMP.some((p) => p.test(n))));
const inicio = Date.now();

/** apaga com algumas tentativas (o Chrome ainda segura o perfil por um instante depois de fechar) */
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

// log do navegador agrupado por mensagem (o three repete o mesmo aviso milhares de vezes na AberturaMes)
const logs = [];
const porMensagem = new Map();
let atual = { composicao: null, quadro: null };
const onBrowserLog = (log) => {
  const chave = `${atual.composicao}|${log.type}|${log.text}`;
  const visto = porMensagem.get(chave);
  if (visto) {
    visto.vezes++;
    return;
  }
  if (logs.length >= 3000) return;
  const item = { composicao: atual.composicao, quadro: atual.quadro, tipo: log.type, texto: String(log.text).slice(0, 4000), vezes: 1 };
  porMensagem.set(chave, item);
  logs.push(item);
};

function confereDisco(onde) {
  const livre = livreMb();
  if (livre < LIMITE) throw new DiscoBaixo(`disco: ${livre.toFixed(0)} MB livres no C: (limite ${LIMITE} MB) antes de ${onde}; parei`);
  return livre;
}

function arquivoDe(tr, quadro) {
  return path.join(tr.saida, `${tr.prefixo}${String(quadro).padStart(4, "0")}.png`);
}

function confereSaida(arq) {
  if (fs.existsSync(arq)) {
    const st = fs.statSync(arq);
    if (st.nlink > 1) throw new Error(`recusado: ${arq} é hardlink (st_nlink ${st.nlink}); escolha outra saída`);
  }
}

let serveUrl = null;
let browser = null;
let codigo = 0;
const feitos = [];
const resumo = { inicio: new Date(inicio).toISOString(), publicDir, saida: saidaGeral, composicoes: null, quadros: feitos, discoInicialMb: null, discoFinalMb: null, tempApagado: [] };

const interrompe = (sinal) => {
  console.error(`interrompido (${sinal}): limpando o Temp`);
  try { if (browser) browser.close({ silent: true }); } catch { /* nada */ }
  limpaTemp(serveUrl);
  process.exit(130);
};
process.on("SIGINT", () => interrompe("SIGINT"));
process.on("SIGTERM", () => interrompe("SIGTERM"));

try {
  resumo.discoInicialMb = Math.round(confereDisco("o bundle"));
  for (const tr of trabalhos) fs.mkdirSync(tr.saida, { recursive: true });
  const t0 = Date.now();
  serveUrl = await bundle({ entryPoint: ENTRADA, publicDir, rspack: true, enableCaching: false, onProgress: () => undefined });
  console.log(`bundle pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s (rspack, public ${publicDir})`);
  browser = await openBrowser("chrome", { browserExecutable: CH, chromiumOptions: CHROMIUM });

  if (cfg.listaComposicoes) {
    const comps = await getCompositions(serveUrl, { puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions: CHROMIUM, onBrowserLog, inputProps: {} });
    resumo.composicoes = comps.map((c) => c.id);
    console.log(`composições (${comps.length}): ${resumo.composicoes.join(", ")}`);
  }

  const selecionadas = new Map();
  const composicaoDe = async (tr) => {
    const chave = trabalhos.indexOf(tr);
    if (!selecionadas.has(chave)) {
      atual = { composicao: tr.composicao, quadro: null };
      const c = await selectComposition({ serveUrl, id: tr.composicao, inputProps: tr.props, puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions: CHROMIUM, onBrowserLog });
      selecionadas.set(chave, c);
    }
    return selecionadas.get(chave);
  };

  const renderiza = async (tr, quadro) => {
    const composition = await composicaoDe(tr);
    const out = arquivoDe(tr, quadro);
    confereSaida(out);
    const livre = confereDisco(`${tr.composicao} quadro ${quadro}`);
    atual = { composicao: tr.composicao, quadro };
    const t1 = Date.now();
    await renderStill({ composition, serveUrl, output: out, frame: quadro, inputProps: tr.props, puppeteerInstance: browser, browserExecutable: CH, binariesDirectory: BIN, chromiumOptions: CHROMIUM, overwrite: true, onBrowserLog, imageFormat: "png" });
    const ms = Date.now() - t1;
    feitos.push({ composicao: tr.composicao, quadro, arquivo: out, ms, livreMb: Math.round(livre) });
    console.log(`ok ${tr.composicao} ${quadro} (${ms} ms, ${Math.round(livre)} MB livres)`);
    return out;
  };

  for (const tr of trabalhos.filter((x) => x.foraDoLote || !cfg.lote)) {
    for (const q of tr.quadros) await renderiza(tr, q);
  }

  if (cfg.lote) {
    const tam = Math.max(1, Number(cfg.lote.tamanho) || 10);
    const doLote = trabalhos.filter((x) => !x.foraDoLote);
    const maior = Math.max(0, ...doLote.map((x) => x.quadros.length));
    for (let b = 0; b * tam < maior; b++) {
      const arquivos = [];
      for (const tr of doLote) {
        for (const q of tr.quadros.slice(b * tam, (b + 1) * tam)) {
          const out = await renderiza(tr, q);
          arquivos.push({ composicao: tr.composicao, prefixo: tr.prefixo, quadro: q, arquivo: out });
        }
      }
      const manifesto = path.join(saidaGeral, `lote-${String(b).padStart(2, "0")}.json`);
      gravaJson(manifesto, { lote: b, arquivos });
      if (Array.isArray(cfg.lote.depois) && cfg.lote.depois.length) {
        const [exe, ...args] = cfg.lote.depois;
        const r = spawnSync(exe, [...args, manifesto], { stdio: "inherit", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8" } });
        if (r.status !== 0) throw new Error(`o comando depois do lote ${b} saiu com código ${r.status}`);
      }
      if (cfg.lote.apaga) {
        for (const a of arquivos) fs.rmSync(a.arquivo, { force: true });
        fs.rmSync(manifesto, { force: true });
        console.log(`lote ${b}: ${arquivos.length} PNG apagados`);
      }
    }
  }
} catch (e) {
  codigo = e instanceof DiscoBaixo ? 3 : 1;
  console.error(`ERRO: ${e && e.stack ? e.stack : e}`);
  resumo.erro = String(e && e.message ? e.message : e);
} finally {
  try {
    if (browser) await browser.close({ silent: true });
  } catch {
    // o navegador pode já ter caído
  }
  resumo.tempApagado = limpaTemp(serveUrl);
  resumo.discoFinalMb = Math.round(livreMb());
  resumo.fim = new Date().toISOString();
  resumo.logs = logs;
  try {
    gravaJson(arqLogs, resumo, { criaPasta: true });
  } catch (e) {
    console.error(`não gravei o log: ${e.message}`);
  }
  console.log(`Temp limpo: ${resumo.tempApagado.length} pasta(s); disco final ${resumo.discoFinalMb} MB`);
}
process.exit(codigo);
