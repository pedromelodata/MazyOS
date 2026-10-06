// A linha que desce: o reel de 05/10, versão 7 (06/10/2026). Pedido do Pedro: "uma linha que desça de cima para
// baixo e, conforme ela vai descendo, os motions vão acontecendo, de uma forma que tudo fique conectado nessa
// linha... ela só não pode ser sem graça". Uma linha só, contínua, num mundo vertical (1080 de largura) que a câmera
// percorre sem corte, como um plano-sequência:
//  - na abertura, a linha passa pela pilha do tradicional, risca o raio do "versus" e desenha o visto do Legalizaí;
//  - no "O que muda pra você?", desenha o ponto de interrogação;
//  - no antes, ela é tinta, meio desenhada à mão: costura a papelada (e leva a carimbada), vira o caminho pontilhado
//    até o escritório e se enrola num espiral em volta do relógio da espera;
//  - no "Agora", o espiral se solta, a linha acende em coral e desenha o celular; liga as etapas, sublinha a guia
//    (a barra do cálculo enche junto, dentro do cartão), puxa o quadrado que fugiu do padrão, contorna o cartão do
//    contador, desenha o coração do cuidado, passa por dentro do app que chega e contorna o Seguir e o link da bio;
//  - no fecho, desenha o visto exatamente onde o símbolo do logo aparece.
// Componente puro: tudo sai do tempo t e dos params (os tempos vêm da cena, presos às palavras da voz). O traçado é
// calculado uma vez, em JS puro (sem DOM), com o comprimento de arco tabelado.
import React from "react";
import { Img, random, staticFile } from "remotion";
import { C, FONT, clamp01, lerp, outBack, outCubic } from "../../../lib/tl";
import { CO } from "../../../motion/kit";

const PI = Math.PI;
const Y0 = 1000; // o mundo começa em y -1000 (a cauda da linha vem de cima do quadro)
const ALTURA_MUNDO = 11000;
const PAPEL = "#FAF8F5";
const TINTA = "#262931";
const CINZA = "#C9C5BE";

const inOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const inCubic = (x: number) => {
  const t = clamp01(x);
  return t * t * t;
};
const jan = (t: number, t0: number, d: number) => clamp01((t - t0) / d);
const mola = (t: number, t0: number, amp: number, f: number, amort: number) => {
  const d = t - t0;
  if (d < 0) return 0;
  return amp * Math.exp(-amort * d) * Math.sin(2 * PI * f * d);
};
const fmt = (x: number) => x.toFixed(2);

// ---------- o traçado ----------
type Pt = [number, number];
type Estilo = "coral" | "tinta" | "rota";

class Tracado {
  pts: Pt[] = [];
  est: Estilo[] = [];
  marcas: Record<string, number> = {};
  private e: Estilo = "coral";
  constructor(x: number, y: number) {
    this.pts.push([x, y]);
    this.est.push(this.e);
  }
  private add(x: number, y: number) {
    this.pts.push([x, y]);
    this.est.push(this.e);
  }
  private get u(): Pt {
    return this.pts[this.pts.length - 1];
  }
  estilo(e: Estilo) {
    this.e = e;
    return this;
  }
  marca(n: string) {
    this.marcas[n] = this.pts.length - 1;
    return this;
  }
  reta(x: number, y: number) {
    const [x0, y0] = this.u;
    const n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / 5));
    for (let i = 1; i <= n; i++) this.add(lerp(x0, x, i / n), lerp(y0, y, i / n));
    return this;
  }
  curva(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const [x0, y0] = this.u;
    const est = Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y);
    const n = Math.max(2, Math.ceil(est / 5));
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const a = (1 - s) * (1 - s) * (1 - s);
      const b = 3 * (1 - s) * (1 - s) * s;
      const c = 3 * (1 - s) * s * s;
      const d = s * s * s;
      this.add(a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y);
    }
    return this;
  }
  arco(cx: number, cy: number, r: number, a0: number, a1: number) {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / 5));
    for (let i = 1; i <= n; i++) {
      const a = lerp(a0, a1, i / n);
      this.add(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    return this;
  }
  espiral(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * (r0 + r1)) / 2 / 5));
    for (let i = 1; i <= n; i++) {
      const s = i / n;
      const a = lerp(a0, a1, s);
      const r = lerp(r0, r1, s);
      this.add(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    return this;
  }
}

// o visto do logo no fecho, em px do quadro (medido no fecho do kit: símbolo de x 355 a 463 e y 764 a 871)
export const VISTO_FECHO: Pt[] = [[379.8, 815.9], [409.3, 843.1], [455.2, 787.3]];
export const CAM_FECHO = 8240;

function monta() {
  const T = new Tracado(540, -900);
  // abertura: a pilha do tradicional (sublinhada), o raio do "versus" e o visto do Legalizaí embaixo do celular
  // (a linha chega no visto subindo, pra quina do visto ler)
  T.reta(540, 230).marca("a0");
  T.curva(540, 420, 85, 400, 85, 650).curva(85, 815, 160, 830, 290, 830).marca("pilha0").reta(400, 830).marca("raio0");
  T.reta(490, 742).reta(455, 802).reta(590, 698).marca("raio1");
  T.curva(650, 652, 560, 1100, 690, 1000).marca("visto0a");
  T.reta(742, 1052).reta(885, 912).marca("visto0b");
  // o ponto de interrogação: a linha dá a volta e entra no gancho subindo (sem bico na emenda)
  T.curva(940, 860, 990, 1000, 900, 1120).curva(780, 1250, 300, 1260, 290, 1480).curva(285, 1610, 400, 1640, 400, 1500).marca("q0");
  T.arco(540, 1500, 140, PI, 2 * PI);
  T.curva(680, 1580, 540, 1570, 540, 1660).reta(540, 1730).marca("q1");
  T.curva(540, 1750, 700, 1740, 700, 1830).curva(700, 1920, 540, 1900, 540, 1990).marca("posq");
  // antes: a costura da papelada
  T.estilo("tinta");
  T.curva(540, 2060, 380, 2080, 380, 2160).marca("costura0");
  T.reta(430, 2125).reta(480, 2205).reta(530, 2135).reta(580, 2215).reta(630, 2145).reta(680, 2225).reta(730, 2155).reta(765, 2265).marca("costura1");
  // o caminho até o escritório
  T.curva(765, 2420, 335, 2380, 335, 2560).reta(335, 2600).marca("casa");
  T.estilo("rota");
  T.curva(420, 2760, 560, 2620, 650, 2780).curva(720, 2950, 800, 3010, 862, 2988).marca("escritorio");
  // a espera: o espiral em volta do relógio
  T.estilo("tinta");
  T.curva(930, 3060, 900, 3300, 860, 3420).marca("espiral0");
  T.espiral(540, 3420, 320, 215, 0, 4.5 * PI).marca("espiral1");
  // agora: a linha acende e desenha o celular
  T.estilo("coral");
  T.reta(540, 3800).marca("fone0");
  T.reta(678, 3800).arco(678, 3872, 72, -PI / 2, 0).reta(750, 4588).arco(678, 4588, 72, 0, PI / 2).reta(402, 4660)
    .arco(402, 4588, 72, PI / 2, PI).reta(330, 3872).arco(402, 3872, 72, PI, 1.5 * PI).reta(540, 3800).marca("foneFecha");
  T.reta(678, 3800).arco(678, 3872, 72, -PI / 2, 0).reta(750, 4230).marca("foneSai");
  // cada passo
  T.curva(820, 4230, 905, 4260, 905, 4330).reta(905, 4380).marca("passo1").reta(905, 4510).marca("passo2")
    .reta(905, 4640).marca("passo3").reta(905, 4770).marca("passo4");
  // a guia: a linha passa por cima do cartão, desce pela esquerda e sublinha o cartão no "calcula" (a barra do
  // cálculo enche junto, dentro do cartão); nada atravessa o cartão
  T.curva(905, 4880, 860, 4960, 760, 4960).reta(280, 4960).curva(170, 4960, 130, 5010, 130, 5120).reta(130, 5400).marca("guia0");
  T.curva(130, 5520, 170, 5575, 280, 5575).reta(800, 5575).marca("guia1");
  T.curva(900, 5575, 960, 5620, 960, 5720).marca("guia2").reta(960, 5850).marca("guia3");
  // fugiu do padrão
  T.curva(960, 5940, 940, 6000, 870, 6000).marca("padrao0").reta(560, 6000).marca("padrao1");
  T.curva(470, 6000, 380, 6070, 360, 6200).marca("padrao2");
  // o cartão do contador
  T.curva(300, 6300, 190, 6360, 190, 6460).marca("cartao0");
  T.arco(230, 6460, 40, PI, 1.5 * PI).reta(850, 6420).arco(850, 6460, 40, -PI / 2, 0).reta(890, 6740)
    .arco(850, 6740, 40, 0, PI / 2).reta(540, 6780).marca("cartao1");
  // o coração do cuidado
  T.reta(540, 6950).marca("coracao0");
  T.curva(560, 6880, 700, 6860, 700, 6980).curva(700, 7080, 600, 7140, 540, 7210).curva(480, 7140, 380, 7080, 380, 6980)
    .curva(380, 6860, 520, 6880, 540, 6950).marca("coracao1");
  T.curva(600, 6900, 790, 6880, 790, 7040).curva(790, 7200, 700, 7330, 640, 7370).marca("saiCoracao");
  // por dentro do app que chega
  T.curva(600, 7390, 540, 7380, 540, 7440).marca("fone2a").reta(540, 8180).marca("fone2b");
  // o Seguir e o link da bio
  T.curva(450, 8200, 340, 8240, 360, 8330).marca("pilula1a");
  T.arco(416, 8330, 56, PI, 1.5 * PI).reta(664, 8274).arco(664, 8330, 56, -PI / 2, PI / 2).reta(416, 8386)
    .arco(416, 8330, 56, PI / 2, PI).marca("pilula1b");
  T.curva(352, 8430, 318, 8480, 330, 8560).marca("pilula2a");
  T.arco(380, 8560, 50, PI, 1.5 * PI).reta(700, 8510).arco(700, 8560, 50, -PI / 2, PI / 2).reta(540, 8610).marca("pilula2b");
  // o visto do fecho, onde o símbolo do logo aparece
  const [v0, v1, v2] = VISTO_FECHO.map(([x, y]) => [x, y + CAM_FECHO] as Pt);
  T.curva(540, 8800, 360, 8950, v0[0], v0[1]).marca("visto1a").reta(v1[0], v1[1]).reta(v2[0], v2[1]).marca("visto1b");
  // comprimento de arco
  const L: number[] = [0];
  for (let i = 1; i < T.pts.length; i++) L.push(L[i - 1] + Math.hypot(T.pts[i][0] - T.pts[i - 1][0], T.pts[i][1] - T.pts[i - 1][1]));
  const marcasS: Record<string, number> = {};
  for (const k of Object.keys(T.marcas)) marcasS[k] = L[T.marcas[k]];
  return { pts: T.pts, est: T.est, idx: T.marcas, L, s: marcasS, total: L[L.length - 1] };
}

export const TRACADO = monta();

function pontoEm(s: number): { p: Pt; i: number; ang: number } {
  const { L, pts } = TRACADO;
  if (s <= 0) return { p: pts[0], i: 0, ang: PI / 2 };
  if (s >= L[L.length - 1]) {
    const n = pts.length - 1;
    return { p: pts[n], i: n, ang: Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]) };
  }
  let lo = 0;
  let hi = L.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (L[m] <= s) lo = m;
    else hi = m;
  }
  const u = (s - L[lo]) / Math.max(1e-6, L[hi] - L[lo]);
  const a = pts[lo];
  const b = pts[hi];
  return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], i: lo, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

// ---------- interpolação monótona (Fritsch-Carlson): sem passar do ponto e sem tranco ----------
function monotona(xs: number[], ys: number[]) {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const s = (x - xs[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

// ---------- tempos ----------
export type Tempos = Record<string, number>;
/** chaves da ponta da linha (nome da marca do traçado e o tempo); o mesmo nome repetido segura a ponta parada */
export type Chave = [string, number, number?];

function relogios(chaves: Chave[], camera: Array<[number, number]>) {
  const ts = chaves.map((c) => c[1]);
  const ss = chaves.map((c) => (TRACADO.s[c[0]] ?? 0) + (c[2] ?? 0));
  const ponta = monotona(ts, ss);
  const cam = monotona(camera.map((c) => c[0]), camera.map((c) => c[1]));
  return { ponta, cam };
}

// ---------- pequenos desenhos ----------
const sombra = (y: number, b: number, a: number) => `drop-shadow(0 ${y}px ${b}px rgba(27,30,36,${a}))`;
const SOMBRA = `${sombra(18, 26, 0.13)} ${sombra(4, 8, 0.07)}`;

/** faíscas que estouram de (x, y) a partir de t0 */
function faiscas(t: number, t0: number, x: number, y: number, semente: string, cor = C.coral, n = 12, raio = 120, dur = 0.55) {
  const d = t - t0;
  if (d < 0 || d > dur) return null;
  const k = d / dur;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * 2 * PI + random(`${semente}-a${i}`) * 0.5;
        const v = 0.6 + random(`${semente}-v${i}`) * 0.6;
        const r0 = raio * v * outCubic(k);
        const r1 = r0 + 22 * (1 - k);
        return (
          <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1}
            stroke={i % 3 === 0 ? C.white : cor} strokeWidth={6 * (1 - k) + 1} strokeLinecap="round" opacity={1 - k} />
        );
      })}
    </g>
  );
}

/** o toque (círculo de dedo): chega de baixo, aperta em tAperta, solta a onda e sai pelo mesmo lado (sai logo, pra
 *  não cobrir o texto que o botão ganha) */
function toque(t: number, x: number, y: number, tChega: number, tAperta: number, tSai: number) {
  if (t < tChega || t > tSai + 0.3) return null;
  const k = outCubic(jan(t, tChega, tAperta - tChega));
  const fora = outCubic(jan(t, tSai, 0.28));
  const px = x + (1 - k) * 140 + fora * 120;
  const py = y + (1 - k) * 200 + fora * 170;
  const aperto = 1 - 0.18 * Math.sin(PI * jan(t, tAperta - 0.04, 0.16));
  const op = Math.min(jan(t, tChega, 0.12), 1 - jan(t, tSai, 0.2));
  const onda = jan(t, tAperta, 0.45);
  return (
    <g opacity={op}>
      {onda > 0 && onda < 1 ? <circle cx={x} cy={y} r={lerp(24, 92, outCubic(onda))} fill="none" stroke={C.white} strokeWidth={lerp(10, 2, onda)} opacity={(1 - onda) * 0.9} /> : null}
      <g transform={`translate(${fmt(px)} ${fmt(py)}) scale(${fmt(aperto)})`}>
        <circle r={46} fill="rgba(255,255,255,0.32)" />
        <circle r={32} fill={C.white} stroke="rgba(27,30,36,0.22)" strokeWidth={3} style={{ filter: sombra(6, 10, 0.25) }} />
      </g>
    </g>
  );
}

const visto = (x: number, y: number, s: number, cor: string, k = 1, larg = 9) => (
  <path d={`M${x - 20 * s} ${y} L${x - 6 * s} ${y + 14 * s} L${x + 22 * s} ${y - 14 * s}`} stroke={cor} strokeWidth={larg} fill="none"
    strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k)} />
);

/** folhas de papel (a pilha), centradas em (x, y) */
function pilha(x: number, y: number, w: number, h: number, sc: number, semente: string) {
  const folhas = [
    { r: -7, dx: -8, dy: 10, cor: "#E5E2DD" },
    { r: 4, dx: 8, dy: 4, cor: "#ECE9E4" },
    { r: -1.5, dx: 0, dy: 0, cor: "#F6F4F0" },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${fmt(sc)})`} style={{ filter: SOMBRA }}>
      {folhas.map((f, i) => (
        <g key={i} transform={`translate(${f.dx} ${f.dy}) rotate(${f.r})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={f.cor} stroke={CINZA} strokeWidth={2} />
          {i === 2
            ? [0, 1, 2, 3].map((k) => (
                <rect key={k} x={-w / 2 + 26} y={-h / 2 + 30 + k * (h - 60) / 3.4} width={(w - 52) * (0.55 + random(`${semente}${k}`) * 0.45)} height={10} rx={5} fill="#D8D4CD" />
              ))
            : null}
        </g>
      ))}
    </g>
  );
}

/** celular com moldura escura e a tela por cima (a tela é Img, desenhada na camada HTML) */
function moldura(x: number, y: number, w: number, h: number, r: number, op: number) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} fill="#0E1014" opacity={op} />;
}

// ---------- a cena ----------
export type ParamsLinha = {
  t: number;
  dur: number;
  tempos: Tempos;
  chaves: Chave[];
  camera: Array<[number, number]>;
  telas: { splash: { src: string }; atividade: { src: string }; home: { src: string } };
};

function Vista({ t, dur, tempos: T, chaves, camera, telas }: ParamsLinha) {
  const { ponta, cam } = relogios(chaves, camera);
  const S = ponta(t);
  const camY = cam(t);
  const vis = (y0: number, y1: number) => y1 > camY - 300 && y0 < camY + 1920 + 300;
  const g = (k: string, def: number) => (typeof T[k] === "number" ? T[k] : def);
  const tAgora = g("agora", 9.4);

  // ---- a linha até S, em trechos por estilo ----
  const { pts, est, L, idx } = TRACADO;
  const h = pontoEm(S);
  const ultimo = h.i;
  const i0Esp = idx.espiral0;
  const i1Esp = idx.espiral1;
  const iCost0 = idx.costura0;
  const iCost1 = idx.costura1;
  const solta = jan(t, tAgora, 0.7);
  const tCarimbo = g("papel", 5.76);
  const tFim = g("fimLinha", 31.9);
  const someLinha = jan(t, tFim, 0.6);
  const trechos: Array<{ e: Estilo; d: string; esp: boolean }> = [];
  let atual: { e: Estilo; d: string; esp: boolean } | null = null;
  let lx = 0;
  let ly = 0;
  for (let i = 0; i <= ultimo + 1; i++) {
    let x: number;
    let y: number;
    let e: Estilo;
    if (i <= ultimo) {
      [x, y] = pts[i];
      e = est[i];
    } else {
      [x, y] = h.p;
      e = est[Math.min(ultimo + 1, est.length - 1)];
    }
    const esp = i >= i0Esp && i <= i1Esp;
    // mão: a tinta e a rota tremem de leve
    if (e !== "coral") {
      const s = L[Math.min(i, L.length - 1)];
      x += 1.6 * Math.sin(s * 0.047 + 1.3) + 0.7 * Math.sin(s * 0.131);
      y += 1.4 * Math.sin(s * 0.039 + 0.4) + 0.6 * Math.sin(s * 0.117 + 2);
    }
    // a carimbada: a linha da costura balança com o impacto
    if (i >= iCost0 && i <= iCost1 && t > tCarimbo) {
      const fall = Math.max(0, 1 - Math.abs(x - 560) / 170);
      y += mola(t, tCarimbo, 14, 7, 9) * fall;
    }
    // o espiral se solta no "Agora"
    if (esp && solta > 0) {
      // o fim do espiral fica preso na linha nova (sem dente na emenda)
      const f = (i - i0Esp) / Math.max(1, i1Esp - i0Esp);
      const w = 1 - clamp01((f - 0.78) / 0.22);
      const k = outCubic(solta) * w * w * (3 - 2 * w);
      x = 540 + (x - 540) * (1 + 0.32 * k);
      y = 3420 + (y - 3420) * (1 + 0.32 * k);
    }
    if (!atual || atual.e !== e || atual.esp !== esp) {
      if (atual) trechos.push(atual);
      atual = { e, d: i === 0 ? `M${fmt(x)} ${fmt(y)}` : `M${fmt(lx)} ${fmt(ly)} L${fmt(x)} ${fmt(y)}`, esp };
    } else {
      atual.d += ` L${fmt(x)} ${fmt(y)}`;
    }
    lx = x;
    ly = y;
  }
  if (atual) trechos.push(atual);

  const corPonta = est[Math.min(ultimo + 1, est.length - 1)] === "coral" ? C.coral : TINTA;
  const emCoral = corPonta === C.coral;
  const pulso = 1 + 0.08 * Math.sin(t * 2 * PI * 2.2);

  // ---- as cenas (coordenadas do mundo) ----
  const tLegal = g("legalizai", 1.96);
  const tVs = g("vs", 1.22);
  const tTrad = g("tradicional", 0.76);
  const tVoce = g("voce", 4.02);
  const tAtiv = g("atividade", 11.64);
  const tPasso = g("passo", 12.92);
  const tSistema = g("sistema", 14.94);
  const tCalcula = g("calcula", 15.34);
  const tCalculaFim = g("calculaFim", 15.92);
  const tEmite = g("emite", 16.3);
  const tAvisa = g("avisa", 17.24);
  const tPaga = g("paga", 18.94);
  const tFugiu = g("fugiu", 20.45);
  const tSimples = g("simples", 22.02);
  const tContador = g("contador", 22.88);
  const tVerdade = g("verdade", 23.24);
  const tCrc = g("crc", 24.64);
  const tMas = g("mas", 26.99);
  const tChegando = g("chegando", 28.36);
  const tSegue = g("segue", 29.22);
  const tLink = g("link", 30.44);

  const passoT = (n: string) => {
    // o tempo em que a ponta passa pela marca n
    const alvo = TRACADO.s[n];
    let a = 0;
    let b = dur;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      if (ponta(m) < alvo) a = m;
      else b = m;
    }
    return b;
  };

  const abaixo: React.ReactNode[] = [];
  const acima: React.ReactNode[] = [];
  const htmlAbaixo: React.ReactNode[] = [];
  const htmlAcima: React.ReactNode[] = [];

  // abertura: o tradicional à esquerda, o Legalizaí à direita, o "versus" no meio
  if (vis(300, 1150)) {
    const pb = 1 + mola(t, tTrad, 0.07, 2.4, 6);
    abaixo.push(<g key="pilha0">{pilha(285, 650, 250, 180, pb, "p0")}</g>);
    const brilho = Math.max(0, Math.sin(PI * jan(t, tLegal, 0.9)));
    // o celular dá um pulo quando o visto fecha
    const tV = passoT("visto0b");
    const fs = 1 + mola(t, tV, 0.045, 2.6, 6);
    abaixo.push(
      <g key="fone0">
        <circle cx={800} cy={610} r={270} fill={`url(#halo)`} opacity={0.25 + brilho * 0.75} />
        <g transform={`translate(800 610) scale(${fmt(fs)}) translate(-800 -610)`}>{moldura(800, 610, 236, 480, 42, 1)}</g>
      </g>,
    );
    htmlAbaixo.push(
      <Img key="fone0i" src={staticFile(telas.splash.src)} style={{ position: "absolute", left: 800 - 108, top: Y0 + 610 - 230, width: 216, height: 460, borderRadius: 33,
        objectFit: "cover", transform: `scale(${fmt(fs)})`, transformOrigin: "108px 230px" }} />,
    );
    htmlAbaixo.push(
      <div key="ilha0" style={{ position: "absolute", left: 800 - 33, top: Y0 + 610 - 218, width: 66, height: 20, borderRadius: 10, background: "#0E1014",
        transform: `scale(${fmt(fs)})`, transformOrigin: "33px 218px" }} />,
    );
    const pv = outBack(jan(t, tVs, 0.38), 2.4);
    if (pv > 0) {
      acima.push(
        <g key="vs" transform={`translate(545 560) rotate(-8) scale(${fmt(pv)})`} style={{ filter: SOMBRA }}>
          <circle r={66} fill={C.ink} />
          <text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={60} fill={C.white} letterSpacing="-0.04em">VS</text>
        </g>,
      );
    }
    acima.push(<g key="f0">{faiscas(t, tVs + 0.05, 495, 765, "vs", C.coral, 14, 150)}</g>);
    acima.push(<g key="f1">{faiscas(t, tV, 885, 912, "visto0", C.coral, 10, 110)}</g>);
  }
  // o ponto da interrogação
  if (vis(1300, 1900)) {
    const pd = outBack(jan(t, tVoce, 0.34), 2.6);
    if (pd > 0) acima.push(<circle key="ponto" cx={540} cy={1815} r={30 * pd} fill={C.coral} />);
  }
  // a papelada e o carimbo
  if (vis(2050, 2420)) {
    const pp = outBack(jan(t, g("abrir", 4.98) - 0.25, 0.4), 1.8);
    const pb = 1 + mola(t, tCarimbo, 0.05, 3, 7);
    if (pp > 0) abaixo.push(<g key="pilha1" opacity={clamp01(pp * 2)}>{pilha(560, 2230, 340, 230, pp * pb, "p1")}</g>);
    // a marca do carimbo fica no papel
    const pm = jan(t, tCarimbo, 0.12);
    if (pm > 0) {
      abaixo.push(
        <g key="marca" transform={`translate(560 2195) rotate(-12) scale(${fmt(lerp(1.3, 1, outCubic(pm)))})`} opacity={0.92}>
          <circle r={50} fill="none" stroke={C.coral} strokeWidth={8} />
          <circle r={38} fill="none" stroke={C.coral} strokeWidth={3} />
          {visto(0, 2, 1.1, C.coral, 1, 8)}
        </g>,
      );
    }
    // o carimbo desce, bate e sobe
    const tc0 = tCarimbo - 0.3;
    if (t > tc0 && t < tCarimbo + 0.75) {
      const desce = inCubic(jan(t, tc0, 0.3));
      const sobe = outCubic(jan(t, tCarimbo + 0.12, 0.45));
      const y = lerp(-330, 0, desce) - sobe * 260;
      const sq = t >= tCarimbo ? 1 - 0.16 * Math.sin(PI * jan(t, tCarimbo, 0.14)) : 1;
      const op = 1 - jan(t, tCarimbo + 0.4, 0.3);
      acima.push(
        <g key="carimbo" transform={`translate(560 ${fmt(2150 + y)})`} opacity={op} style={{ filter: SOMBRA }}>
          <g transform={`scale(${fmt(2 - sq)} ${fmt(sq)})`}>
            <circle cx={0} cy={-150} r={30} fill="#3A3D44" />
            <rect x={-16} y={-126} width={32} height={66} rx={10} fill="#4A4D55" />
            <rect x={-82} y={-64} width={164} height={50} rx={14} fill="#5B5E66" />
            <rect x={-92} y={-18} width={184} height={30} rx={8} fill={TINTA} />
          </g>
        </g>,
      );
    }
    acima.push(<g key="f2">{faiscas(t, tCarimbo, 560, 2215, "carimbo", TINTA, 10, 130, 0.45)}</g>);
  }
  // a casa, o escritório e o alfinete
  if (vis(2450, 3050)) {
    const pc = outBack(jan(t, g("ida", 6.5) - 0.3, 0.35), 2);
    if (pc > 0) {
      abaixo.push(
        <g key="casa" transform={`translate(230 2560) scale(${fmt(pc)})`} style={{ filter: SOMBRA }}>
          <path d="M-78 -20 L0 -88 L78 -20 Z" fill="#D9D5CE" stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
          <rect x={-62} y={-24} width={124} height={88} rx={6} fill="#F1EEE9" stroke={TINTA} strokeWidth={6} />
          <rect x={-18} y={14} width={36} height={50} rx={5} fill={TINTA} />
        </g>,
      );
    }
    const pe = outBack(jan(t, g("escritorio", 6.7) - 0.2, 0.4), 1.8);
    if (pe > 0) {
      abaixo.push(
        <g key="escritorio" transform={`translate(860 2840) scale(${fmt(pe)})`} style={{ filter: SOMBRA }}>
          <rect x={-88} y={-132} width={176} height={264} rx={10} fill="#ECE9E4" stroke={TINTA} strokeWidth={6} />
          {Array.from({ length: 12 }).map((_, k) => (
            <rect key={k} x={-62 + (k % 3) * 44} y={-108 + Math.floor(k / 3) * 46} width={36} height={30} rx={5} fill="#D3CEC6" />
          ))}
          <rect x={-22} y={78} width={44} height={54} rx={5} fill={TINTA} />
        </g>,
      );
    }
    const tp = g("escritorioFim", 7.15);
    const pa = jan(t, tp, 0.5);
    if (pa > 0) {
      const y = lerp(-140, 0, outBounceLocal(pa));
      acima.push(
        <g key="alfinete" transform={`translate(860 ${fmt(2672 + y)})`}>
          <ellipse cx={0} cy={58 - y} rx={22 * clamp01(pa * 2)} ry={7 * clamp01(pa * 2)} fill="rgba(27,30,36,0.18)" />
          <path d="M0 52 C-10 30 -38 6 -38 -16 a38 38 0 0 1 76 0 C38 6 10 30 0 52 Z" fill={C.coral} style={{ filter: sombra(8, 10, 0.2) }} />
          <circle cx={0} cy={-16} r={14} fill={C.white} />
        </g>,
      );
    }
  }
  // o relógio da espera
  if (vis(3050, 3800)) {
    const pr = outBack(jan(t, g("espera", 7.54) - 0.35, 0.4), 1.8);
    if (pr > 0) {
      const giro = 3 * inCubic(jan(t, g("espera", 7.54) - 0.1, 1.5)) + 0.5 * jan(t, g("atendido", 8.44), 1);
      const toca = mola(t, g("atendido", 8.44), 7, 9, 5);
      const passado = jan(t, tAgora, 0.6);
      const am = giro * 2 * PI;
      const ah = am / 12 + PI * 0.4;
      abaixo.push(
        <g key="relogio" transform={`translate(540 3420) rotate(${fmt(toca)}) scale(${fmt(pr * (1 - 0.12 * passado))})`} opacity={1 - 0.6 * passado} style={{ filter: SOMBRA }}>
          <circle cx={-120} cy={-150} r={48} fill="#D9D5CE" stroke={TINTA} strokeWidth={6} />
          <circle cx={120} cy={-150} r={48} fill="#D9D5CE" stroke={TINTA} strokeWidth={6} />
          <circle r={180} fill={C.white} stroke={TINTA} strokeWidth={16} />
          {Array.from({ length: 12 }).map((_, k) => {
            const a = (k / 12) * 2 * PI;
            const r1 = k % 3 === 0 ? 132 : 146;
            return <line key={k} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * 160} y2={-Math.cos(a) * 160} stroke={k % 3 === 0 ? TINTA : CINZA} strokeWidth={k % 3 === 0 ? 10 : 6} strokeLinecap="round" />;
          })}
          <line x1={0} y1={0} x2={Math.sin(ah) * 82} y2={-Math.cos(ah) * 82} stroke={TINTA} strokeWidth={16} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin(am) * 124} y2={-Math.cos(am) * 124} stroke={TINTA} strokeWidth={10} strokeLinecap="round" />
          <circle r={16} fill={TINTA} />
        </g>,
      );
      if (toca !== 0 && t < g("atendido", 8.44) + 0.7) {
        const kk = jan(t, g("atendido", 8.44), 0.7);
        acima.push(
          <g key="toque-relogio" opacity={1 - kk} stroke={TINTA} strokeWidth={8} strokeLinecap="round">
            {[-1, 1].map((s) => (
              <g key={s}>
                <line x1={540 + s * 215} y1={3240} x2={540 + s * 255} y2={3205} />
                <line x1={540 + s * 232} y1={3290} x2={540 + s * 280} y2={3282} />
              </g>
            ))}
          </g>,
        );
      }
    }
    acima.push(<g key="f3">{faiscas(t, tAgora, 540, 3635, "agora", C.coral, 18, 210, 0.7)}</g>);
  }
  // o celular desenhado pela linha
  if (vis(3700, 4800)) {
    const tFecha = passoT("foneFecha");
    const pf = jan(t, tFecha - 0.08, 0.2);
    if (pf > 0) {
      abaixo.push(<g key="fone1">{moldura(540, 4230, 420, 860, 72, pf)}</g>);
      const tela = (src: string, op: number, k: string) =>
        op > 0.002 ? (
          <Img key={k} src={staticFile(src)} style={{ position: "absolute", left: 540 - 194, top: Y0 + 4230 - 414, width: 388, height: 828, borderRadius: 58, objectFit: "cover", opacity: op }} />
        ) : null;
      const a1 = jan(t, g("com", 11.15) - 0.05, 0.2);
      const a2 = jan(t, tPasso, 0.2);
      htmlAbaixo.push(tela(telas.splash.src, pf * (1 - a1), "s1"));
      htmlAbaixo.push(tela(telas.atividade.src, a1 * (1 - a2), "s2"));
      htmlAbaixo.push(tela(telas.home.src, a2, "s3"));
      htmlAbaixo.push(pf > 0.01 ? <div key="ilha" style={{ position: "absolute", left: 540 - 58, top: Y0 + 3830, width: 116, height: 34, borderRadius: 17, background: "#0E1014", opacity: pf }} /> : null);
    }
    // o cartão da atividade vem na cara de quem vê e volta
    const ida = jan(t, tAtiv - 0.02, 0.36);
    const volta = jan(t, tAtiv + 0.72, 0.32);
    if (ida > 0 && volta < 1) {
      const k = outBack(ida, 1.6) * (1 - inOut(volta));
      const sc = lerp(0.5, 1.14, k);
      const y = lerp(3985, 4080, k);
      acima.push(
        <g key="cartao-ativ" transform={`translate(540 ${fmt(y)}) rotate(${fmt(lerp(0, -3, k))}) scale(${fmt(sc)})`} opacity={clamp01(ida * 4) * (1 - jan(volta, 0.75, 0.25))}
          style={{ filter: `${sombra(30 * k, 40 * k, 0.22)}` }}>
          <rect x={-280} y={-86} width={560} height={172} rx={30} fill={C.white} stroke={C.coral} strokeWidth={5} />
          <rect x={-252} y={-50} width={100} height={100} rx={26} fill={C.coral} />
          {visto(-202, 2, 1.25, C.white, 1, 10)}
          <text x={-126} y={-6} fontFamily={FONT} fontWeight={800} fontSize={48} fill={C.ink} letterSpacing="-0.03em">Web design</text>
          <rect x={-126} y={16} width={150} height={44} rx={22} fill={C.coral} />
          <text x={-51} y={47} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.white}>Principal</text>
        </g>,
      );
    }
    // cada passo
    ["passo1", "passo2", "passo3", "passo4"].forEach((n, k) => {
      const y = 4380 + k * 130;
      const tn = passoT(n);
      const pn = jan(t, tn, 0.22);
      const nasce = outBack(jan(t, g("foneSaiT", 10.6) + k * 0.06, 0.3), 2);
      if (nasce <= 0) return;
      abaixo.push(
        <g key={n} transform={`translate(905 ${y}) scale(${fmt(nasce * (1 + mola(t, tn, 0.25, 3, 8)))})`}>
          <circle r={32} fill={pn > 0 ? C.coral : C.white} stroke={pn > 0 ? C.coral : CINZA} strokeWidth={6} style={{ filter: sombra(6, 10, 0.12) }} />
          {pn > 0 ? visto(0, 2, 0.9, C.white, pn, 8) : null}
        </g>,
      );
    });
  }
  // a guia: o cálculo, a emissão, o aviso e o pagamento
  if (vis(5000, 5560)) {
    const pg = outBack(jan(t, tSistema - 0.1, 0.4), 1.5);
    if (pg > 0) {
      const cont = outCubic(jan(t, tCalcula, tCalculaFim - tCalcula));
      const cent = Math.round(17831 * cont);
      const txt = `R$ ${Math.floor(cent / 100)},${String(cent % 100).padStart(2, "0")}`;
      const pb = outBack(jan(t, tEmite, 0.35), 2);
      const pago = jan(t, tPaga + 0.1, 0.2);
      // o sino do aviso fica dentro do cartão, no canto livre
      const ps = outBack(jan(t, tAvisa, 0.3), 2.4);
      const bal = mola(t, tAvisa + 0.1, 18, 2.2, 3.2);
      abaixo.push(
        <g key="guia" transform={`translate(540 5290) scale(${fmt(lerp(0.88, 1, pg))})`} opacity={clamp01(pg * 2)} style={{ filter: SOMBRA }}>
          <rect x={-350} y={-220} width={700} height={440} rx={38} fill={C.white} />
          <text x={-300} y={-150} fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.coral6}>Vence dia 20</text>
          <text x={-300} y={-98} fontFamily={FONT} fontWeight={800} fontSize={44} fill={C.ink} letterSpacing="-0.02em">Seu imposto de junho</text>
          <text x={-300} y={6} fontFamily={FONT} fontWeight={800} fontSize={88} fill={C.ink} letterSpacing="-0.035em">{txt}</text>
          <rect x={-310} y={32} width={620} height={16} rx={8} fill="#F1EEE9" />
          {cont > 0.005 ? <rect x={-310} y={32} width={fmt(Math.max(16, 620 * cont))} height={16} rx={8} fill={C.coral} /> : null}
          {ps > 0 ? (
            <g transform={`translate(272 -142) scale(${fmt(0.82 * ps)})`}>
              <g transform={`rotate(${fmt(bal)} 0 -40)`}>
                <path d="M-40 26 C-40 -26 -26 -46 0 -46 C26 -46 40 -26 40 26 L50 40 L-50 40 Z" fill={C.coral} />
                <circle cx={0} cy={50} r={12} fill={C.coral6} />
                <circle cx={0} cy={-50} r={8} fill={C.coral6} />
              </g>
              <circle cx={36} cy={-40} r={14} fill={C.ink} stroke={C.white} strokeWidth={4} />
            </g>
          ) : null}
          {pb > 0 ? (
            <g transform={`translate(0 140) scale(${fmt(pb * (1 - 0.06 * Math.sin(PI * jan(t, tPaga - 0.02, 0.16))))})`}>
              <rect x={-190} y={-44} width={380} height={88} rx={44} fill={pago > 0 ? C.white : C.coral} stroke={C.coral} strokeWidth={pago > 0 ? 6 : 0} />
              {pago > 0 ? (
                <>
                  {visto(-146, 2, 0.75, C.coral6, pago, 7)}
                  <text x={24} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.coral6} opacity={pago}>Código copiado</text>
                </>
              ) : (
                <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.white}>Pagar agora</text>
              )}
            </g>
          ) : null}
        </g>,
      );
      acima.push(<g key="toque-paga">{toque(t, 650, 5440, tPaga - 0.3, tPaga, tPaga + 0.12)}</g>);
    }
  }
  // fugiu do padrão
  if (vis(5850, 6250)) {
    const tl = passoT("padrao1");
    for (let k = 0; k < 7; k++) {
      const x = 210 + k * 110;
      const pk = outBack(jan(t, g("e2", 19.96) - 0.35 + k * 0.04, 0.3), 2);
      if (pk <= 0) continue;
      if (k === 3) {
        // a linha passa por baixo e o quadrado pula pra fora da fileira, pra cima (nada cruza a linha)
        const sai = outCubic(jan(t, tl, 0.5));
        const xx = lerp(x, 440, sai);
        const yy = lerp(5900, 5790, sai) - 70 * Math.sin(PI * sai);
        const sq = 1 + 0.12 * sai;
        abaixo.push(
          <rect key={`q${k}`} x={xx - 32} y={yy - 32} width={64} height={64} rx={16} fill={sai > 0.05 ? C.coral : "#D9D5CE"}
            transform={`translate(${fmt(xx)} ${fmt(yy)}) rotate(${fmt(-24 * sai)}) scale(${fmt(sq)}) translate(${fmt(-xx)} ${fmt(-yy)})`} opacity={clamp01(pk * 2)} />,
        );
      } else {
        abaixo.push(<rect key={`q${k}`} x={x - 32 * pk} y={5900 - 32 * pk} width={64 * pk} height={64 * pk} rx={16} fill="#D9D5CE" />);
      }
    }
    acima.push(<g key="f4">{faiscas(t, tFugiu, 540, 6000, "fugiu", C.coral, 10, 110, 0.45)}</g>);
  }
  // o cartão do contador
  if (vis(6380, 6820)) {
    const pc = outBack(jan(t, g("no2", 21.59) - 0.15, 0.4), 1.5);
    if (pc > 0) {
      const pav = outBack(jan(t, tContador, 0.35), 2);
      const ppl = outBack(jan(t, tSimples, 0.32), 2.2);
      const pdoc = outCubic(jan(t, tVerdade, 0.45));
      const pent = outBack(jan(t, tVerdade + 0.35, 0.3), 2.2);
      const pcrc = outBack(jan(t, tCrc, 0.35), 2.4);
      const varre = jan(t, tCrc + 0.15, 0.6);
      abaixo.push(
        <g key="contador" transform={`translate(540 6600) scale(${fmt(lerp(0.9, 1, pc))})`} opacity={clamp01(pc * 2)} style={{ filter: SOMBRA }}>
          <rect x={-350} y={-180} width={700} height={360} rx={40} fill={C.white} />
          {pav > 0 ? (
            <g transform={`translate(-230 -30) scale(${fmt(pav)})`}>
              <circle r={78} fill={CO.c100} />
              <circle cx={0} cy={-18} r={28} fill={C.ink} />
              <path d="M-50 52 C-46 14 -24 2 0 2 C24 2 46 14 50 52 Z" fill={C.ink} />
            </g>
          ) : null}
          <rect x={-120} y={-74} width={250} height={22} rx={11} fill="#E7E3DD" />
          <rect x={-120} y={-34} width={180} height={18} rx={9} fill="#EFECE7" />
          {pcrc > 0 ? (
            <g transform={`translate(-30 70) rotate(-8) scale(${fmt(pcrc)})`}>
              <circle r={62} fill={C.coral} />
              <circle r={50} fill="none" stroke={C.white} strokeWidth={4} opacity={0.6} />
              <text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={38} fill={C.white} letterSpacing="0.02em">CRC</text>
              {varre > 0 && varre < 1 ? <rect x={-80 + 160 * varre} y={-70} width={18} height={140} fill="rgba(255,255,255,0.55)" transform="rotate(20)" /> : null}
            </g>
          ) : null}
          {ppl > 0 ? (
            <g transform={`translate(220 -128) scale(${fmt(ppl)})`}>
              <rect x={-92} y={-26} width={184} height={52} rx={26} fill={CO.c100} />
              <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.coral6} letterSpacing="0.03em">PLANO ME</text>
            </g>
          ) : null}
          {pdoc > 0 ? (
            <g transform={`translate(${fmt(lerp(380, 215, pdoc))} 50)`} opacity={pdoc}>
              <rect x={-90} y={-70} width={180} height={140} rx={16} fill="#F6F4F0" stroke="#E3DED7" strokeWidth={3} />
              {[0, 1, 2].map((k) => <rect key={k} x={-66} y={-44 + k * 26} width={k === 2 ? 80 : 132} height={12} rx={6} fill="#D8D4CD" />)}
              {pent > 0 ? (
                <g transform={`translate(0 42) rotate(-8) scale(${fmt(pent)})`}>
                  <rect x={-74} y={-22} width={148} height={44} rx={22} fill={C.white} stroke={C.coral} strokeWidth={4} />
                  <text x={0} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill={C.coral6}>Entregue</text>
                </g>
              ) : null}
            </g>
          ) : null}
        </g>,
      );
    }
  }
  // o coração do cuidado
  if (vis(6850, 7260)) {
    const tC = passoT("coracao1");
    const pfill = jan(t, tC, 0.3);
    if (pfill > 0) {
      const bate = 1 + mola(t, tC, 0.09, 2.2, 5);
      abaixo.push(
        <path key="coracao" d="M540 6950 C560 6880 700 6860 700 6980 C700 7080 600 7140 540 7210 C480 7140 380 7080 380 6980 C380 6860 520 6880 540 6950 Z"
          fill={CO.c100} opacity={pfill} transform={`translate(540 7040) scale(${fmt(bate)}) translate(-540 -7040)`} />,
      );
    }
    acima.push(<g key="f5">{faiscas(t, tC, 540, 6950, "cuidado", C.coral, 10, 120, 0.5)}</g>);
  }
  // o app que tá chegando (passa por cima da linha: a linha corre por dentro dele)
  if (vis(7350, 8150)) {
    const pch = jan(t, tMas, Math.max(0.3, tChegando - tMas));
    if (pch > 0) {
      const k = outBack(pch, 1.25);
      const x = lerp(1400, 540, k);
      const rastro = 1 - jan(pch, 0.7, 0.3);
      acima.push(
        <g key="fone2">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x + 210 + i * 40} y={7600 + i * 70} width={140 - i * 30} height={10} rx={5} fill={C.coral} opacity={0.5 * rastro} />
          ))}
          <circle cx={x} cy={7750} r={260} fill="url(#halo)" opacity={0.35 + 0.5 * Math.max(0, Math.sin(PI * jan(t, tChegando, 0.9)))} />
          <g style={{ filter: SOMBRA }}>{moldura(x, 7750, 360, 740, 62, 1)}</g>
        </g>,
      );
      htmlAcima.push(
        <Img key="fone2i" src={staticFile(telas.splash.src)} style={{ position: "absolute", left: x - 166, top: Y0 + 7750 - 354, width: 332, height: 708, borderRadius: 50, objectFit: "cover" }} />,
      );
      htmlAcima.push(<div key="ilha2" style={{ position: "absolute", left: x - 48, top: Y0 + 7750 - 344, width: 96, height: 28, borderRadius: 14, background: "#0E1014" }} />);
    }
  }
  // o Seguir e o link da bio
  if (vis(8200, 8660)) {
    const p1 = jan(t, tSegue + 0.06, 0.2);
    const seguido = jan(t, tSegue + 0.66, 0.18);
    if (p1 > 0) {
      const sc = 1 - 0.07 * Math.sin(PI * jan(t, tSegue + 0.56, 0.16)) + mola(t, tSegue + 0.66, 0.06, 3, 7);
      abaixo.push(
        <g key="seguir" transform={`translate(540 8330) scale(${fmt(sc)})`}>
          <rect x={-180} y={-56} width={360} height={112} rx={56} fill={seguido > 0 ? C.white : C.coral} opacity={p1} />
          {seguido > 0 ? (
            <>
              {visto(-120, 2, 0.8, C.coral6, seguido, 8)}
              <text x={30} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={42} fill={C.coral6}>Seguindo</text>
            </>
          ) : (
            <text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={C.white} opacity={p1}>Seguir</text>
          )}
        </g>,
      );
    }
    acima.push(<g key="toque-seguir">{toque(t, 640, 8340, tSegue + 0.25, tSegue + 0.58, tSegue + 0.7)}</g>);
    const p2 = jan(t, passoT("pilula2a") - 0.05, 0.2);
    const clicou = jan(t, tLink + 0.08, 0.16);
    if (p2 > 0) {
      const sc = 1 - 0.07 * Math.sin(PI * jan(t, tLink, 0.16)) + mola(t, tLink + 0.08, 0.05, 3, 7);
      abaixo.push(
        <g key="link" transform={`translate(540 8560) scale(${fmt(sc)})`} opacity={p2}>
          <rect x={-210} y={-50} width={420} height={100} rx={50} fill={clicou > 0 ? C.coral : CO.c100} />
          <g transform="translate(-118 0)" stroke={clicou > 0 ? C.white : C.coral6} strokeWidth={6} strokeLinecap="round" fill="none">
            <path d="M-6 6 L6 -6" />
            <path d="M-11 -1 l-7 7 a10 10 0 0 0 14 14 l7 -7" />
            <path d="M11 1 l7 -7 a10 10 0 0 0 -14 -14 l-7 7" />
          </g>
          <text x={28} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={38} fill={clicou > 0 ? C.white : C.coral6}>link da bio</text>
        </g>,
      );
    }
    acima.push(<g key="toque-link">{toque(t, 690, 8570, tLink - 0.28, tLink, tLink + 0.12)}</g>);
  }

  // ---- o fundo: papel, a trama de pontos que anda com a câmera e manchas coral com paralaxe ----
  const manchas = [
    { y: 700, x: 900, r: 380 }, { y: 2300, x: 120, r: 420 }, { y: 4100, x: 980, r: 520 }, { y: 5900, x: 100, r: 460 },
    { y: 7600, x: 960, r: 480 }, { y: 8900, x: 200, r: 420 },
  ];
  const fundo = (
    <div style={{ position: "absolute", inset: 0, background: PAPEL, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(203,197,188,0.5) 2.2px, transparent 2.8px)", backgroundSize: "44px 44px",
        backgroundPosition: `0px ${fmt(-camY % 44)}px` }} />
      {manchas.map((m, k) => {
        const y = m.y - camY * 0.55 - 300;
        if (y < -800 || y > 2700) return null;
        return <div key={k} style={{ position: "absolute", left: m.x - m.r, top: y - m.r, width: m.r * 2, height: m.r * 2, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(242,100,60,0.10) 0%, rgba(242,100,60,0) 70%)" }} />;
      })}
    </div>
  );

  const corDe = (e: Estilo) => (e === "coral" ? C.coral : TINTA);
  const linhaSvg = (
    <g opacity={1 - someLinha}>
      {trechos.map((tr, k) => {
        if (tr.e === "coral") {
          return (
            <g key={k}>
              <path d={tr.d} stroke={C.coral} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.1} />
              <path d={tr.d} stroke={C.coral} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d={tr.d} stroke="#FFD5C5" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7} />
            </g>
          );
        }
        const op = tr.esp ? 1 - 0.7 * outCubic(solta) : 1;
        return (
          <path key={k} d={tr.d} stroke={corDe(tr.e)} strokeWidth={tr.e === "rota" ? 9 : 8} strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray={tr.e === "rota" ? "1 22" : undefined} opacity={op} />
        );
      })}
    </g>
  );
  // a ponta: conta luminosa (coral) ou ponta de lápis (tinta)
  const [hx, hy] = h.p;
  const pontaSvg = S < TRACADO.total - 1 && someLinha < 1 ? (
    <g opacity={1 - someLinha}>
      {emCoral ? <circle cx={hx} cy={hy} r={44 * pulso} fill="url(#halo)" /> : null}
      {Array.from({ length: 7 }).map((_, k) => {
        const s2 = S - (k + 1) * 26;
        if (s2 <= 0) return null;
        const q = pontoEm(s2).p;
        const j = random(`rastro${k}${Math.floor(t * 30)}`);
        return <circle key={k} cx={q[0] + (j - 0.5) * 18} cy={q[1] + (random(`rr${k}${Math.floor(t * 30)}`) - 0.5) * 18} r={(emCoral ? 4.5 : 3) * (1 - k / 8)} fill={emCoral ? C.coral : TINTA} opacity={0.7 * (1 - k / 7)} />;
      })}
      <circle cx={hx} cy={hy} r={emCoral ? 15 : 10} fill={corPonta} />
      <circle cx={hx - 3} cy={hy - 3} r={emCoral ? 5 : 3} fill={C.white} opacity={0.85} />
    </g>
  ) : null;
  // o visto do fecho fica até o logo assumir
  const vFim = passoT("visto1b");
  const vistoFinal = t > vFim ? (
    <g opacity={1 - jan(t, vFim + 0.55, 0.35)}>
      <path d={`M${VISTO_FECHO[0][0]} ${VISTO_FECHO[0][1] + CAM_FECHO} L${VISTO_FECHO[1][0]} ${VISTO_FECHO[1][1] + CAM_FECHO} L${VISTO_FECHO[2][0]} ${VISTO_FECHO[2][1] + CAM_FECHO}`}
        stroke={C.coral} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ) : null;

  const defs = (
    <defs>
      <radialGradient id="halo">
        <stop offset="0" stopColor="#F2643C" stopOpacity="0.42" />
        <stop offset="1" stopColor="#F2643C" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
  // no fecho, o mundo sai e fica só a linha desenhando o visto do logo (nada de botão repetido atrás do fecho)
  const vivo = 1 - jan(t, g("fecho", tFim - 0.35) - 0.2, 0.35);
  const camada = (filhos: React.ReactNode, k: string, op = 1) => (
    <svg key={k} width={1080} height={ALTURA_MUNDO} viewBox={`0 ${-Y0} 1080 ${ALTURA_MUNDO}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: op }}>
      {defs}
      {filhos}
    </svg>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden" }}>
      {fundo}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: ALTURA_MUNDO, transform: `translateY(${fmt(-(camY + Y0))}px)` }}>
        {camada(abaixo, "abaixo", vivo)}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: ALTURA_MUNDO, opacity: vivo }}>{htmlAbaixo}</div>
        {camada(<>{linhaSvg}{vistoFinal}</>, "linha")}
        {camada(acima, "acima", vivo)}
        {camada(pontaSvg, "ponta")}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: ALTURA_MUNDO, opacity: vivo }}>{htmlAcima}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 700,
        background: `linear-gradient(180deg, ${PAPEL} 0%, rgba(250,248,245,0.99) 62%, rgba(250,248,245,0.9) 76%, rgba(250,248,245,0) 100%)` }} />
    </div>
  );
}

function outBounceLocal(x: number) {
  const t = clamp01(x);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const u = t - 1.5 / d1;
    return n1 * u * u + 0.75;
  }
  if (t < 2.5 / d1) {
    const u = t - 2.25 / d1;
    return n1 * u * u + 0.9375;
  }
  const u = t - 2.625 / d1;
  return n1 * u * u + 0.984375;
}

/** a camada: a vista do tempo t e, no fim, a volta pro quadro 0 (a fusão começa quando o fecho sai, sem quadro vazio
 *  antes do loop, e fecha um pouco antes do último quadro, que fica igual ao quadro 0) */
export const LinhaDescendo: React.FC<ParamsLinha> = (p) => {
  const fusao = jan(p.t, p.dur - 0.8, 0.7);
  return (
    <div style={{ position: "relative", width: 1080, height: 1920 }}>
      <Vista {...p} />
      {fusao > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: fusao }}>
          <Vista {...p} t={0} />
        </div>
      ) : null}
    </div>
  );
};
