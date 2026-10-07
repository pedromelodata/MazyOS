// Corta uma fala em blocos de 3 a 4 palavras pra legenda (pedido do Pedro, 07/10), preferindo cortar depois da
// pontuação, sem pontuação no meio do bloco e sem terminar bloco em palavra fraca ("e", "de", "um"...).
// Com os tempos da fala (tempo = {s: [início de cada palavra], fim: quando a fala sai}), ele também evita:
//  - bloco que fica menos de 0,55 s na tela (na fala rápida, "que a gente" ficava 0,26 s);
//  - a palavra de ênfase fechando um bloco que troca logo depois dela (ela mal aparecia acesa).
const FRACAS = new Set(["e", "a", "o", "as", "os", "de", "da", "do", "das", "dos", "no", "na", "nos", "nas", "com", "pra", "pro", "que", "um", "uma", "é", "em", "por", "se", "sua", "seu"]);
const limpa = (w) => w.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/g, "");
// expressões que não se partem entre dois blocos (na v8, "E clica no link / da bio." quebrava a CTA)
const COLA = new Set(["link da", "da bio", "prestador de", "de serviço", "contador de", "de verdade"]);
export const DUR_MIN = 0.55, CHAVE_MIN = 0.45, SEGURA_CHAVE = 0.3;
export function blocos(ws, tempo = null, chave = -1) {
  const n = ws.length;
  const pont = ws.map((w) => /[,.!?;:]$/.test(w));
  const colado = ws.map((w, i) => i + 1 < n && !pont[i] && COLA.has(`${limpa(w)} ${limpa(ws[i + 1])}`));
  const ini = (i) => (i < n ? tempo.s[i] : tempo.fim);
  const custo = (a, b) => {
    const k = b - a;
    // no máximo 4 palavras por bloco (pedido do Pedro: "apenas aparecendo 3 a 4 palavras"; na v8 a fala mais rápida
    // juntava "e sua empresa parada esperando." num bloco só)
    let c = { 1: 7, 2: 2.4, 3: 0, 4: 0 }[k];
    if (c === undefined) return 99;
    if (b < n && colado[b - 1]) c += 6;                              // parte uma expressão colada
    for (let i = a; i < b - 1; i++) if (pont[i]) c += 2.8;          // pontuação no meio do bloco
    if (b < n && pont[b - 1]) c -= 1.4;                              // corte logo depois da pontuação
    if (b < n && FRACAS.has(limpa(ws[b - 1]))) c += 4.2;             // bloco terminando em palavra fraca (ela é
                                                                     // dita no fim e mal acende: "E clica no")
    if (tempo) {
      const d = ini(b) - ini(a);
      if (d < DUR_MIN) c += (DUR_MIN - d) * 10;                      // bloco curto demais na tela
      if (chave === b - 1 && b < n && ini(b) - ini(b - 1) < CHAVE_MIN) c += 1.5;   // ênfase no fim, trocando logo
    }
    return c;
  };
  const best = Array(n + 1).fill(Infinity), prev = Array(n + 1).fill(-1);
  best[0] = 0;
  for (let b = 1; b <= n; b++) for (let a = Math.max(0, b - 4); a < b; a++) {
    const c = best[a] + custo(a, b);
    if (c < best[b]) { best[b] = c; prev[b] = a; }
  }
  const cortes = [];
  for (let b = n; b > 0; b = prev[b]) cortes.unshift([prev[b], b]);
  return cortes;
}

// Os blocos de uma frase da narração (p = {w, key, s, out}) com os tempos da legenda: o bloco entra com a 1ª palavra
// dele e o anterior sai em 0,06 s logo antes, sem os dois na tela juntos; o último fica até a fala seguinte. Quando a
// ênfase fecha o bloco, a troca espera SEGURA_CHAVE s depois dela (sem passar do fim da 1ª palavra do bloco
// seguinte), pra ela aparecer acesa.
export function legendaDaFrase(words, p) {
  const ws = p.w.map((wi) => words[wi].t);
  const ch = p.w.indexOf(p.key);
  const tempo = { s: p.w.map((wi) => words[wi].s), fim: p.out - 0.26 };
  const bl = blocos(ws, tempo, ch);
  const troca = bl.map(([, b], k) => {
    if (k === bl.length - 1) return null;
    let t = words[p.w[b]].s - 0.04;
    if (ch === b - 1) t = Math.min(Math.max(t, words[p.key].s + SEGURA_CHAVE), words[p.w[b]].e - 0.05);
    return t;
  });
  return bl.map(([a, b], k) => {
    const ultimo = k === bl.length - 1;
    const tin = k === 0 ? p.s - 0.1 : troca[k - 1];
    const tout = ultimo ? p.out - 0.26 : troca[k] - 0.06;
    return { a, b, idx: p.w.slice(a, b), ws: ws.slice(a, b), txt: ws.slice(a, b).join(" "), ik: ch >= a && ch < b ? ch - a : -1,
      tin, tout, dIn: k === 0 ? 0.18 : 0.12, dOut: ultimo ? 0.14 : 0.06, ultimo };
  });
}
