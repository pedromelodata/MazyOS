// Grava os blocos da legenda da versão Remotion (src/cinco/legenda.json) com o mesmo corte do AE (blocos.mjs) e os
// tempos da narração (legenda-tempos.json, que o gera.mjs grava). Uso: node legenda-remotion.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legendaDaFrase } from "../sufoco-linha-ae/blocos.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const { words, phrases } = JSON.parse(fs.readFileSync(path.join(AQUI, "legenda-tempos.json"), "utf8"));
const blocos = [];
phrases.forEach((p, n) => {
  const bl = legendaDaFrase(words, p);
  bl.forEach((b, k) => {
    // corte seco: o bloco fica até o próximo entrar (sem o vão de 0,06 s da troca com fade do AE)
    const fim = b.ultimo ? b.tout + b.dOut : bl[k + 1].tin;
    blocos.push({ frase: n, ws: b.ws, idx: b.idx, ik: b.ik, tin: b.tin, fim, chave: b.ik >= 0 ? words[p.key].s : null });
  });
});
const SAIDA = path.resolve(AQUI, "../precificacao-2026-10-02/remotion/src/cinco/legenda.json");
fs.writeFileSync(SAIDA, JSON.stringify({ words: words.map(({ t, s, e }) => ({ t, s, e })), blocos }, null, 1));
console.log(`${blocos.length} blocos em ${SAIDA}`);
