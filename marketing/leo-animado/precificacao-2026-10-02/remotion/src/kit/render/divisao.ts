// Linha da tela dividida (dono: extensão comum, 05/10/2026): a conta da linha em px do quadro de 1080x1920, a mesma
// pro render 3D (TelaDividida.tsx, que compõe a câmera 2), pra camada 2D do raio (divisor-vs, no render.tsx da
// extensão comum) e pras batidas tela-dividida e divisor-raio (que calculam onde a linha sai do quadro). Puro: sem
// React, sem DOM e sem three.
//
// O canal é st.canais.divisao: k (0 desliga a divisão e o quadro sai como antes), ang (graus), px e py (um ponto da
// linha), lado (1 ou -1: de que lado fica a câmera 2) e a câmera 2 (x, y, z, tx, ty, tz, fov).
// O ângulo é medido da horizontal, no sentido anti-horário de quem olha a tela: 90 é vertical e 79,38 é a diagonal
// "/" que vai de (720, 0) a (360, 1920). A direção da linha aponta pra cima; o lado 1 ("direita") é o da direita de
// quem anda na linha de baixo pra cima (numa linha deitada, ângulo 0, é o de baixo).

export const LARGURA_QUADRO = 1080;
export const ALTURA_QUADRO = 1920;

/** canal da divisão (st.canais.divisao) */
export const CANAL_DIVISAO = "divisao";

/** a linha: um ponto (px, py), a direção (dx, dy) pra cima e a normal (nx, ny) pro lado 1, em px com y pra baixo */
export type Linha = { px: number; py: number; dx: number; dy: number; nx: number; ny: number };

export function linhaDe(ang: number, px: number, py: number): Linha {
  const a = (ang * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = -Math.sin(a);
  return { px, py, dx, dy, nx: -dy, ny: dx };
}

/** distância assinada do ponto à linha (px): positiva do lado 1 */
export function ladoDoPonto(L: Linha, x: number, y: number): number {
  return (x - L.px) * L.nx + (y - L.py) * L.ny;
}

/** quanto a linha anda na normal, pro lado dado (1 ou -1), até sair do quadro por esse lado, mais a margem (px) */
export function distanciaAteSair(L: Linha, lado: number, margem: number): number {
  let m = 0;
  const cantos: Array<[number, number]> = [[0, 0], [LARGURA_QUADRO, 0], [0, ALTURA_QUADRO], [LARGURA_QUADRO, ALTURA_QUADRO]];
  for (const [x, y] of cantos) m = Math.max(m, lado * ladoDoPonto(L, x, y));
  return m + margem;
}

/** o ponto da linha deslocado d px na normal, pro lado dado (a linha que varre até a borda) */
export function pontoDeslocado(L: Linha, lado: number, d: number): { px: number; py: number } {
  return { px: L.px + lado * L.nx * d, py: L.py + lado * L.ny * d };
}

/** o trecho da linha dentro do quadro alargado pela margem (Liang-Barsky): começa na ponta de cima (ou na da esquerda,
 *  numa linha deitada) e vai até a outra. null quando a linha não cruza o quadro alargado. */
export function trechoNoQuadro(L: Linha, margem: number): null | { ax: number; ay: number; bx: number; by: number; comp: number } {
  const x0 = -margem;
  const y0 = -margem;
  const x1 = LARGURA_QUADRO + margem;
  const y1 = ALTURA_QUADRO + margem;
  let t0 = -1e7;
  let t1 = 1e7;
  const corta = (p: number, q: number) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!corta(-L.dx, L.px - x0) || !corta(L.dx, x1 - L.px) || !corta(-L.dy, L.py - y0) || !corta(L.dy, y1 - L.py)) return null;
  if (t1 <= t0) return null;
  let ax = L.px + L.dx * t0;
  let ay = L.py + L.dy * t0;
  let bx = L.px + L.dx * t1;
  let by = L.py + L.dy * t1;
  // a ponta de cima primeiro (o raio entra de cima pra baixo); deitada, a da esquerda
  if (ay > by + 1e-9 || (Math.abs(ay - by) <= 1e-9 && ax > bx)) {
    const tx = ax;
    const ty = ay;
    ax = bx;
    ay = by;
    bx = tx;
    by = ty;
  }
  return { ax, ay, bx, by, comp: Math.hypot(bx - ax, by - ay) };
}

/** o ponto da linha mais perto de (x, y) (onde o "VS" senta na linha) */
export function pontoMaisPerto(L: Linha, x: number, y: number): { x: number; y: number } {
  const s = (x - L.px) * L.dx + (y - L.py) * L.dy;
  return { x: L.px + L.dx * s, y: L.py + L.dy * s };
}

/** "direita" (ou 1) dá 1; "esquerda" (ou -1) dá -1 */
export function ladoNumero(lado: unknown): number {
  if (lado === "esquerda" || lado === -1) return -1;
  if (lado === "direita" || lado === 1 || lado === undefined || lado === null) return 1;
  throw new Error(`lado da divisão: "direita" ou "esquerda" (recebido ${JSON.stringify(lado)})`);
}
