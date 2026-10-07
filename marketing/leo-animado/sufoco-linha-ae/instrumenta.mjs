// Insere marcos de progresso no monta.jsx: cada marco grava a linha atual num arquivo, na hora.
// Assim, se o After Effects travar, o ultimo marco diz onde foi.
// Uso: node instrumenta.mjs [entrada.jsx] [saida.jsx]
import { readFileSync, writeFileSync } from "node:fs";

const ENT = process.argv[2] || "monta.jsx";
const SAI = process.argv[3] || "monta-marcado.jsx";
const MARCOS = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/sufoco-linha-ae/marcos.log";

const linhas = readFileSync(ENT, "utf8").split("\n");
const fora = (s) => {
  // conta chaves/parenteses/colchetes fora de string
  let d = 0, aspas = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (aspas) {
      if (c === "\\") i++;
      else if (c === aspas) aspas = null;
      continue;
    }
    if (c === '"' || c === "'") aspas = c;
    else if (c === "{" || c === "(" || c === "[") d++;
    else if (c === "}" || c === ")" || c === "]") d--;
  }
  return d;
};

const ini = linhas.findIndex((l) => l.trim() === "try {");
if (ini < 0) throw new Error("não achei o try { do começo");

const saida = [];
// a funcao de marco, antes de tudo
saida.push(`var MARCOS = new File(${JSON.stringify(MARCOS)});`);
saida.push(`function marco(n, t) { MARCOS.encoding = "UTF-8"; MARCOS.open("a"); MARCOS.writeln(n + " | " + t); MARCOS.close(); }`);
saida.push(`(function(){ var f = new File(${JSON.stringify(MARCOS)}); f.open("w"); f.write(""); f.close(); })();`);

const PURGA = Number(process.argv[4] || 150);   // libera cache a cada N instrucoes (0 desliga)
let prof = 0;
let n = 0;
for (let i = 0; i < linhas.length; i++) {
  const l = linhas[i];
  saida.push(l);
  if (i === ini) { saida.push(`app.beginUndoGroup("montagem");`); prof += fora(l); continue; }
  if (i < ini) { prof += fora(l); continue; }
  prof += fora(l);
  const t = l.trim();
  if (!t || t.startsWith("//")) continue;
  // so marca quando o statement fechou (profundidade de volta ao nivel do try) e fora de funcao
  if (prof !== 1) continue;
  if (t === "}" || t.startsWith("} catch") || t.startsWith("var flog")) continue;
  n++;
  saida.push(`marco(${i + 1}, ${JSON.stringify(t.slice(0, 110))});`);
  if (PURGA && n % PURGA === 0) saida.push(`try { app.purge(PurgeTarget.ALL_CACHES); } catch (e) {}`);
}
saida.push(`try { app.endUndoGroup(); } catch (e) {}`);
writeFileSync(SAI, saida.join("\n"));
console.log(`${SAI}: ${n} marcos em ${linhas.length} linhas (começo no try da linha ${ini + 1})`);
