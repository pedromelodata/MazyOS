// O símbolo do Legalizaí (identidade/logos/simbolo.svg): quadrado coral de 211,09 com cantos de 32,84 e o visto
// branco grosso, que sai pela borda direita do quadrado. Pedido do Pedro (v9, 07/10): "corrija esses ícones de check";
// os selos das cenas usavam um visto genérico, fino e centralizado, que não é o da marca.
const L = 211.09, M = L / 2;
// o visto do SVG (path "M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8
// c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87Z") em vértices absolutos, com as tangentes relativas
const V = [[211.09, 32.95], [105.62, 138.42], [72.02, 104.82], [24.15, 104.82], [84.95, 165.62], [126.28, 165.62], [211.09, 80.81]];
const I = [[0, 0], [0, 0], [0, 0], [13.22, -13.22], [0, 0], [-11.41, 11.41], [0, 0]];
const O = [[0, 0], [0, 0], [-13.22, -13.22], [0, 0], [11.41, 11.41], [0, 0], [0, 0]];
const r3 = (x) => Math.round(x * 1000) / 1000;

// o quadrado e o visto no tamanho pedido, centrados no meio do quadrado
export function simbolo(tam, dx = 0, dy = 0) {
  const k = tam / L;
  return {
    raio: r3(32.84 * k),
    v: V.map(([x, y]) => [r3((x - M) * k + dx), r3((y - M) * k + dy)]),
    i: I.map(([x, y]) => [r3(x * k), r3(y * k)]),
    o: O.map(([x, y]) => [r3(x * k), r3(y * k)]),
  };
}

// o visto solto (sem o quadrado), com as proporções do da marca: a linha do meio do visto do SVG (perna curta a 45°,
// perna longa a 45° até a borda), espessura de 16% do quadrado, centrado no próprio desenho. tam = o quadrado de
// referência; a largura do visto fica em ~0,93 tam
export function vistoSolto(tam, dx = 0, dy = 0) {
  const P = [[48.09, 104.82], [105.62, 162.35], [211.09, 56.88]];
  const esp = 33.85;
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const cx = (Math.min(...xs) - esp / 2 + Math.max(...xs) + esp / 2) / 2, cy = (Math.min(...ys) - esp / 2 + Math.max(...ys) + esp / 2) / 2;
  const k = tam / L;
  return { pts: P.map(([x, y]) => [r3((x - cx) * k + dx), r3((y - cy) * k + dy)]), esp: r3(esp * k) };
}
