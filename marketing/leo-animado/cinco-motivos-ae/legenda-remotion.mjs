// Grava os blocos da legenda da versão Remotion (src/cinco/legenda.json) com o mesmo corte do AE (blocos.mjs) e os
// tempos da narração (legenda-tempos.json, que o gera.mjs grava; da v7 em diante, tempos-v7.json, que o voz-v7.py grava,
// com o deslocamento do vídeo). Uso: node legenda-remotion.mjs [arquivo de tempos]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legendaDaFrase, SEGURA_CHAVE } from "../sufoco-linha-ae/blocos.mjs";

// cortes presos (o blocos.mjs escolhe pelo custo, e na v7, com os tempos acertados pela voz, ele empatou e trocou
// "uns 600 de imposto / e uns 9.400 / no bolso." por "de imposto e uns / 9.400 no bolso.", que lê pior)
const FORCA = { "de 10 mil, uns 600 de imposto e uns 9.400 no bolso.": [[0, 3], [3, 7], [7, 10], [10, 12]] };
function cortesForcados(words, p, cortes) {
  // as mesmas regras de tempo do legendaDaFrase, com os cortes dados
  const ws = p.w.map((wi) => words[wi].t);
  const ch = p.w.indexOf(p.key);
  const troca = cortes.map(([, b], k) => {
    if (k === cortes.length - 1) return null;
    let t = words[p.w[b]].s - 0.04;
    if (ch === b - 1) t = Math.min(Math.max(t, words[p.key].s + SEGURA_CHAVE), words[p.w[b]].e - 0.05);
    return t;
  });
  return cortes.map(([a, b], k) => {
    const ultimo = k === cortes.length - 1;
    return { a, b, idx: p.w.slice(a, b), ws: ws.slice(a, b), ik: ch >= a && ch < b ? ch - a : -1,
      tin: k === 0 ? p.s - 0.1 : troca[k - 1], tout: ultimo ? p.out - 0.26 : troca[k] - 0.06, dOut: ultimo ? 0.14 : 0.06, ultimo };
  });
}

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TEMPOS = process.argv[2] || "legenda-tempos.json";
const { words, phrases, desloca = 0 } = JSON.parse(fs.readFileSync(path.join(AQUI, TEMPOS), "utf8"));
const blocos = [];
phrases.forEach((p, n) => {
  const txt = p.w.map((wi) => words[wi].t).join(" ");
  const bl = FORCA[txt] ? cortesForcados(words, p, FORCA[txt]) : legendaDaFrase(words, p);
  bl.forEach((b, k) => {
    // corte seco: o bloco fica até o próximo entrar (sem o vão de 0,06 s da troca com fade do AE)
    const fim = b.ultimo ? b.tout + b.dOut : bl[k + 1].tin;
    blocos.push({ frase: n, ws: b.ws, idx: b.idx, ik: b.ik, tin: b.tin, fim, chave: b.ik >= 0 ? words[p.key].s : null });
  });
});
const SAIDA = path.resolve(AQUI, "../precificacao-2026-10-02/remotion/src/cinco/legenda.json");
fs.writeFileSync(SAIDA, JSON.stringify({ desloca, words: words.map(({ t, s, e }) => ({ t, s, e })), blocos }, null, 1));
console.log(`${blocos.length} blocos em ${SAIDA}`);
