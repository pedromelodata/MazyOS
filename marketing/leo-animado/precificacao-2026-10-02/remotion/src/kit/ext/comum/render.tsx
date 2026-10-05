// Extensão "comum" do kit de motion (render). Contrato: KIT/DESENHO.md, seção 4.10.
// - objeto "palco-argila": o palco de argila genérico (palco/fabrica.ts); a mesma fábrica desenha os tipos de palco
//   que outras extensões registram (o "palco-tvl" da peça de 05/10 se liga a ela no render.tsx dela);
// - objeto "argila": um objeto de argila do carrossel de 05/10 solto na cena (objetos/argila.ts);
// - camada 2D "pilula-comenta": a pílula coral "Comenta aí" com o balão, a do fecho do carrossel;
// - camada 2D "divisor-vs" (05/10): o raio na linha da tela dividida, com faíscas e o "VS", entre o 3D e a legenda.
// O render só LÊ o estado (st.canais, st.obj e st.cam): quem anima são as batidas (batidas.ts).
import React from "react";
import { AbsoluteFill } from "remotion";
import type { CamadaExtensao, RenderExtensao } from "../../render/tipos-render";
import { CANAL_DIVISAO, linhaDe, pontoMaisPerto, trechoNoQuadro } from "../../render/divisao";
import { TIPO_PALCO, num } from "./palco/modelo";
import { fabricaPalco } from "./palco/fabrica";
import { fabricaArgila } from "./objetos/argila";

// ---------- camada 2D: pílula "Comenta aí" (a do fecho do carrossel) ----------
const txt = (x: unknown, p: string) => (typeof x === "string" && x ? x : p);

const Balao: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 30 30" style={{ display: "block" }}>
    <path
      d="M6.5 5h17A3.5 3.5 0 0 1 27 8.5v10a3.5 3.5 0 0 1 -3.5 3.5H14.2l-5.7 4.6V22H6.5A3.5 3.5 0 0 1 3 18.5v-10A3.5 3.5 0 0 1 6.5 5z"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.6}
      strokeLinejoin="round"
    />
  </svg>
);

const CamadaPilula: CamadaExtensao = ({ id, st, props }) => {
  const def = (props.camadas || []).filter((c) => c.id === id)[0];
  if (!def) return null;
  const c = st.canais[id] || {};
  const k = num(c.k, 0);
  if (k <= 0.001) return null;
  const tam = num(def.tamanho, 36);
  const z = tam / 34;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: num(def.top, 968), display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.3) }}>
      <div
        style={{
          scale: `${0.7 + 0.3 * k}`,
          display: "inline-flex",
          alignItems: "center",
          gap: 14 * z,
          background: txt(def.cor, "#DD4E27"),
          color: "#FFFFFF",
          borderRadius: 999,
          padding: `${20 * z}px ${40 * z}px`,
          fontFamily: "Sora",
          fontWeight: 800,
          fontSize: tam,
          lineHeight: 1,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 26px rgba(221,78,39,0.28)",
        }}
      >
        <Balao tam={Math.round(30 * z)} />
        <span>{txt(def.texto, "Comenta aí")}</span>
      </div>
    </div>
  );
};

// ---------- camada 2D: o raio da tela dividida, com o "VS" (05/10/2026) ----------
// O raio fica na linha da divisão (canal divisao, o da batida tela-dividida; sem ele, ang, px e py da camada), entre o
// 3D e a legenda (sobLegenda). Miolo branco com dois filamentos finos, brilho coral em três camadas desfocadas
// (largo, médio e o fio coral-600 colado no miolo), tremor elétrico pelo quadro (ruído com semente: o mesmo em toda
// aba e em qualquer ordem de quadro), faíscas com semente, velocidade, arrasto e gravidade (as do impacto e as que
// pingam da linha acesa), traço afinando da cabeça quente pro rabo, e o "VS" em Sora 800, branco com contorno fino
// tinta e brilho coral. Quem anima é a batida divisor-raio: raio (entrada de cima pra baixo), clarao, estouro, vs
// (pop com mola e a saída do VS) e sai (o raio apaga).
const COR_RAIO = { miolo: "#FFFFFF", coral: "#F2643C", coral6: "#DD4E27", claro: "#FBDDD1", papel: "#FFF7F2", tinta: "#1B1E24" };
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** embaralha um inteiro de 32 bits (a mesma resposta em qualquer aba e em qualquer ordem de quadro) */
function mistura(x: number): number {
  let h = x | 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}
/** sorteio de 0 a 1 pela semente e por até três índices inteiros */
function sorteio(semente: number, a: number, b = 0, c = 0): number {
  return mistura(mistura(mistura(Math.imul(semente | 0, 0x9e3779b1) + (a | 0)) + Math.imul(b | 0, 0x85ebca6b)) + Math.imul(c | 0, 0xc2b2ae35)) / 4294967296;
}
const s11 = (semente: number, a: number, b = 0, c = 0) => sorteio(semente, a, b, c) * 2 - 1;

/** do branco quente ao coral, conforme a faísca esfria (k de 0 a 1) */
function corFaisca(k: number): string {
  const e = clamp01(k);
  const r = Math.round(255 + (242 - 255) * e);
  const g = Math.round(255 + (100 - 255) * e);
  const b = Math.round(255 + (60 - 255) * e);
  return `rgb(${r},${g},${b})`;
}

type Trecho = { ax: number; ay: number; bx: number; by: number; comp: number };
/** faísca: cabeça (hx, hy), rabo (rx, ry), largura na cabeça, opacidade e a cor da cabeça */
type Faisca = { hx: number; hy: number; rx: number; ry: number; w: number; a: number; cor: string };

/** a linha do raio, de cima pra baixo até a fração "ate": um vértice a cada 22 px, com o tremor na perpendicular
 *  (ruído grosso, a cada 5 vértices, e fino, por vértice; um sorteio novo por quadro). Perto da cabeça que desce, o
 *  zigue-zague abre mais. */
function caminhoRaio(tr: Trecho, ate: number, quadro: number, semente: number, amp: number, cabeca: boolean): string {
  const PASSO = 22;
  const ux = (tr.bx - tr.ax) / tr.comp;
  const uy = (tr.by - tr.ay) / tr.comp;
  const fim = tr.comp * clamp01(ate);
  const grosso = (i: number) => {
    const j = Math.floor(i / 5);
    const f = (i % 5) / 5;
    const s = f * f * (3 - 2 * f);
    const a = s11(semente, quadro, j, 1);
    const b = s11(semente, quadro, j + 1, 1);
    return a + (b - a) * s;
  };
  const pts: string[] = [];
  for (let i = 0; ; i++) {
    const d = Math.min(i * PASSO, fim);
    let off = amp * (0.6 * grosso(i) + 0.6 * s11(semente, quadro, i, 2));
    if (cabeca) off *= 1 + 3 * Math.exp(-Math.pow((fim - d) / 80, 2));
    pts.push(`${(tr.ax + ux * d - uy * off).toFixed(1)},${(tr.ay + uy * d + ux * off).toFixed(1)}`);
    if (d >= fim) break;
  }
  return `M${pts.join("L")}`;
}

/** galhos curtos do impacto (o raio que se abre perto do VS), sorteados a cada quadro */
function galhos(qx: number, qy: number, ux: number, uy: number, quadro: number, semente: number): string[] {
  const r: string[] = [];
  for (let g = 0; g < 4; g++) {
    const lado = g % 2 === 0 ? 1 : -1;
    const ao = s11(semente, 500 + g, quadro, 1) * 150; // onde o galho nasce, ao longo da linha
    const ang = lado * (0.45 + 0.4 * sorteio(semente, 500 + g, quadro, 2));
    const comp = 50 + 100 * sorteio(semente, 500 + g, quadro, 3);
    // direção: a da linha (pra baixo) girada pro lado
    const dx = ux * Math.cos(ang) - uy * Math.sin(ang);
    const dy = ux * Math.sin(ang) + uy * Math.cos(ang);
    let x = qx + ux * ao;
    let y = qy + uy * ao;
    const pts = [`${x.toFixed(1)},${y.toFixed(1)}`];
    const n = 6;
    for (let i = 1; i <= n; i++) {
      const passo = comp / n;
      const desvio = s11(semente, 600 + g, quadro, i) * 11;
      x += dx * passo - dy * desvio * 0.5;
      y += dy * passo + dx * desvio * 0.5;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    r.push(`M${pts.join("L")}`);
  }
  return r;
}

/** posição e velocidade de uma faísca com arrasto k e gravidade g (px/s²), depois de "a" segundos */
function voo(x0: number, y0: number, vx: number, vy: number, a: number, k: number, g: number) {
  const e = Math.exp(-k * a);
  const f = (1 - e) / k;
  const vt = g / k;
  return { x: x0 + vx * f, y: y0 + vt * a + (vy - vt) * f, vx: vx * e, vy: vt + (vy - vt) * e };
}

/** a faísca na posição p, com o rabo pra trás na direção da velocidade: 34 ms de rastro, no máximo 80 px e nunca
 *  mais que o caminho já feito desde a origem (x0, y0) (no quadro do estouro ela ainda é só um ponto) */
function faisca(p: { x: number; y: number; vx: number; vy: number }, x0: number, y0: number, w: number, a: number, cor: string): Faisca {
  let tx = p.vx * 0.034;
  let ty = p.vy * 0.034;
  const l = Math.hypot(tx, ty);
  const lc = Math.max(1, Math.min(80, l, Math.hypot(p.x - x0, p.y - y0)));
  if (l > 1e-6) {
    tx *= lc / l;
    ty *= lc / l;
  } else {
    ty = lc;
  }
  return { hx: p.x, hy: p.y, rx: p.x - tx, ry: p.y - ty, w, a, cor };
}

/** traço que afina: cabeça com a largura w, rabo em ponta (a fração "ate" do comprimento, a partir da cabeça) */
function traco(f: Faisca, w: number, ate: number): string {
  const dx = f.hx - f.rx;
  const dy = f.hy - f.ry;
  const l = Math.max(1e-3, Math.hypot(dx, dy));
  const nx = (-dy / l) * (w / 2);
  const ny = (dx / l) * (w / 2);
  const rx = f.hx - dx * ate;
  const ry = f.hy - dy * ate;
  return `${(f.hx + nx).toFixed(1)},${(f.hy + ny).toFixed(1)} ${(f.hx - nx).toFixed(1)},${(f.hy - ny).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}`;
}

const CamadaDivisor: CamadaExtensao & { sobLegenda?: boolean } = ({ id, st, props, t }) => {
  const def = (props.camadas || []).filter((c) => c.id === id)[0];
  if (!def) return null;
  const c = st.canais[id] || {};
  const raio = clamp01(num(c.raio, 0));
  const clarao = clamp01(num(c.clarao, 0));
  const vs = Math.max(0, num(c.vs, 0));
  const sai = clamp01(num(c.sai, 0));
  const estouro = clamp01(num(c.estouro, 0));
  const durEstouro = Math.max(0.05, num(c.estouroDur, 1));
  if (sai >= 0.999) return null;
  if (raio <= 0.0005 && vs <= 0.0005 && clarao <= 0.0005 && !(estouro > 0 && estouro < 1)) return null;

  // a linha: a da divisão (tela-dividida); sem ela, a da camada
  const dv = st.canais[CANAL_DIVISAO];
  const fonte = dv && typeof dv.ang === "number" ? dv : (def as Record<string, unknown>);
  const L = linhaDe(num(fonte.ang, 79.38), num(fonte.px, 540), num(fonte.py, 960));
  const tr = trechoNoQuadro(L, 120);
  if (!tr) return null;
  const ux = (tr.bx - tr.ax) / tr.comp;
  const uy = (tr.by - tr.ay) / tr.comp;
  const semente = Math.round(num(def.semente, 7));
  const quadro = Math.round(t * props.fps);
  const Q = pontoMaisPerto(L, num(def.vsX, 540), num(def.vsY, 960));
  const apaga = 1 - sai * sai; // o raio segura e apaga no fim da saída
  const pisca = 1 + 0.08 * s11(semente, quadro, 0, 9);
  const forca = (1 + 0.9 * clarao) * pisca * apaga;
  const aceso = raio >= 0.999;
  const amp = num(def.tremor, 2.4);
  const d = raio > 0.0005 ? caminhoRaio(tr, raio, quadro, semente, amp, !aceso) : "";
  // dois filamentos finos em volta do miolo, cada um com o seu ruído (a textura elétrica)
  const filamentos = raio > 0.0005 ? [1, 2].map((k) => ({ d: caminhoRaio(tr, raio, quadro, semente + 101 * k, amp * 2.3, !aceso), a: (0.22 + 0.35 * sorteio(semente, quadro, k, 31)) * apaga })) : [];
  const miolo = num(def.miolo, 5);

  // faíscas: as do impacto (estouro) e as que pingam da linha acesa
  const G = 2600;
  const faiscas: Faisca[] = [];
  if (estouro > 0 && estouro < 1) {
    const idade = estouro * durEstouro;
    for (let i = 0; i < 44; i++) {
      const vida = (0.36 + 0.64 * sorteio(semente, 7000 + i, 5)) * durEstouro;
      if (idade >= vida) continue;
      const ao = s11(semente, 7000 + i, 1) * 120;
      const lado = sorteio(semente, 7000 + i, 2) < 0.5 ? -1 : 1;
      const th = s11(semente, 7000 + i, 3) * 0.85;
      const vel = 600 + 1150 * Math.pow(sorteio(semente, 7000 + i, 4), 1.4);
      const nx = lado * L.nx;
      const ny = lado * L.ny;
      const vx = (nx * Math.cos(th) - ny * Math.sin(th)) * vel;
      const vy = (nx * Math.sin(th) + ny * Math.cos(th)) * vel - 0.35 * vel;
      const ox = Q.x + ux * ao;
      const oy = Q.y + uy * ao;
      const p = voo(ox, oy, vx, vy, idade, 2.4, G);
      const k = idade / vida;
      const w = (2.6 + 2.8 * sorteio(semente, 7000 + i, 6)) * (1 - 0.5 * k);
      const brilho = 0.75 + 0.25 * s11(semente, 7000 + i, quadro, 7);
      faiscas.push(faisca(p, ox, oy, w, (1 - Math.pow(k, 1.6)) * apaga * brilho, corFaisca((k - 0.25) / 0.6)));
    }
  }
  const pinga = aceso ? clamp01(num(def.faiscas, 1)) * (1 - sai) : 0;
  if (pinga > 0) {
    for (let j = 0; j < 16; j++) {
      const T = 0.45 + 0.6 * sorteio(semente, 9000 + j, 1);
      const fase = sorteio(semente, 9000 + j, 2) * T;
      const m = Math.floor((t + fase) / T);
      const idade = t + fase - m * T;
      const vida = 0.3 + 0.28 * sorteio(semente, 9000 + j, 3, m);
      if (idade >= vida) continue;
      const s = 0.03 + 0.94 * sorteio(semente, 9000 + j, 4, m);
      const x0 = tr.ax + (tr.bx - tr.ax) * s;
      const y0 = tr.ay + (tr.by - tr.ay) * s;
      if (y0 < 0 || y0 > 1920 || x0 < 0 || x0 > 1080) continue;
      const lado = sorteio(semente, 9000 + j, 5, m) < 0.5 ? -1 : 1;
      const th = s11(semente, 9000 + j, 6, m) * 0.7;
      const vel = 280 + 560 * sorteio(semente, 9000 + j, 7, m);
      const nx = lado * L.nx;
      const ny = lado * L.ny;
      const vx = (nx * Math.cos(th) - ny * Math.sin(th)) * vel;
      const vy = (nx * Math.sin(th) + ny * Math.cos(th)) * vel - 0.3 * vel;
      const p = voo(x0, y0, vx, vy, idade, 3, G);
      const k = idade / vida;
      faiscas.push(faisca(p, x0, y0, (1.6 + 1.6 * sorteio(semente, 9000 + j, 8, m)) * (1 - 0.45 * k), (1 - k * k) * pinga, corFaisca((k - 0.2) / 0.6)));
    }
  }

  // o VS: pop com mola (o canal vs passa de 1 e volta) e saída com antecipação, os dois no canal vs (divisor-raio)
  const escVS = vs;
  const opVS = clamp01(vs * 5);
  const tam = num(def.tamanho, 170);
  const texto = typeof def.texto === "string" && def.texto ? def.texto : "VS";
  const giro = -7 * (1 - Math.min(1.2, vs));
  const reg = `${id}-raio`;
  const grandeza = { x: -200, y: -200, width: 1480, height: 2320 };
  const fonteVS = { fontFamily: "Sora", fontWeight: 800, fontSize: tam, letterSpacing: -0.02 * tam } as const;
  const cabeca = !aceso && raio > 0.0005 ? { x: tr.ax + (tr.bx - tr.ax) * raio, y: tr.ay + (tr.by - tr.ay) * raio } : null;
  const ramos = clarao > 0.55 ? galhos(Q.x, Q.y, ux, uy, quadro, semente) : [];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${reg}-largo`} filterUnits="userSpaceOnUse" {...grandeza}><feGaussianBlur stdDeviation={20} /></filter>
          <filter id={`${reg}-medio`} filterUnits="userSpaceOnUse" {...grandeza}><feGaussianBlur stdDeviation={6} /></filter>
          <filter id={`${reg}-fino`} filterUnits="userSpaceOnUse" {...grandeza}><feGaussianBlur stdDeviation={1.6} /></filter>
          <filter id={`${reg}-faisca`} filterUnits="userSpaceOnUse" {...grandeza}><feGaussianBlur stdDeviation={3.4} /></filter>
          <filter id={`${reg}-vsPerto`} filterUnits="userSpaceOnUse" x={-600} y={-500} width={1200} height={1000}><feGaussianBlur stdDeviation={9} /></filter>
          <filter id={`${reg}-vsLonge`} filterUnits="userSpaceOnUse" x={-600} y={-500} width={1200} height={1000}><feGaussianBlur stdDeviation={24} /></filter>
          <filter id={`${reg}-vsSombra`} filterUnits="userSpaceOnUse" x={-600} y={-500} width={1200} height={1000}><feGaussianBlur stdDeviation={7} /></filter>
          <radialGradient id={`${reg}-clarao`}>
            <stop offset="0" stopColor={COR_RAIO.miolo} stopOpacity={1} />
            <stop offset="0.18" stopColor={COR_RAIO.miolo} stopOpacity={0.85} />
            <stop offset="0.42" stopColor={COR_RAIO.claro} stopOpacity={0.5} />
            <stop offset="0.72" stopColor={COR_RAIO.coral} stopOpacity={0.16} />
            <stop offset="1" stopColor={COR_RAIO.coral} stopOpacity={0} />
          </radialGradient>
        </defs>
        {clarao > 0.001 && <rect x={0} y={0} width={1080} height={1920} fill={COR_RAIO.papel} opacity={0.14 * clarao} />}
        {d && (
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={d} stroke={COR_RAIO.coral} strokeWidth={56} strokeOpacity={Math.min(1, 0.22 * forca)} filter={`url(#${reg}-largo)`} />
            <path d={d} stroke={COR_RAIO.coral} strokeWidth={18} strokeOpacity={Math.min(1, 0.5 * forca)} filter={`url(#${reg}-medio)`} />
            <path d={d} stroke={COR_RAIO.coral6} strokeWidth={miolo + 4} strokeOpacity={Math.min(1, 0.9 * apaga)} filter={`url(#${reg}-fino)`} />
            {filamentos.map((f, i) => (
              <path key={`fil${i}`} d={f.d} stroke={COR_RAIO.miolo} strokeWidth={1.3} strokeOpacity={f.a} />
            ))}
            <path d={d} stroke={COR_RAIO.miolo} strokeWidth={miolo * (1 - 0.3 * sai)} strokeOpacity={apaga} />
          </g>
        )}
        {ramos.length > 0 && (
          <g strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={clarao * apaga}>
            {ramos.map((r, i) => (
              <path key={`g${i}`} d={r} stroke={COR_RAIO.coral} strokeWidth={10} strokeOpacity={0.6} filter={`url(#${reg}-medio)`} />
            ))}
            {ramos.map((r, i) => (
              <path key={`m${i}`} d={r} stroke={COR_RAIO.miolo} strokeWidth={2.4} />
            ))}
          </g>
        )}
        {cabeca && (
          <g>
            <circle cx={cabeca.x} cy={cabeca.y} r={74} fill={COR_RAIO.coral} opacity={0.32} filter={`url(#${reg}-largo)`} />
            <circle cx={cabeca.x} cy={cabeca.y} r={34} fill={COR_RAIO.coral} opacity={0.5} filter={`url(#${reg}-medio)`} />
            <circle cx={cabeca.x} cy={cabeca.y} r={15} fill={COR_RAIO.miolo} opacity={0.9} filter={`url(#${reg}-fino)`} />
            <circle cx={cabeca.x} cy={cabeca.y} r={6} fill={COR_RAIO.miolo} />
          </g>
        )}
        {faiscas.length > 0 && (
          <g>
            <g filter={`url(#${reg}-faisca)`}>
              {faiscas.map((f, i) => (
                <polygon key={`b${i}`} points={traco(f, f.w * 2.8, 1)} fill={COR_RAIO.coral} fillOpacity={0.6 * f.a} />
              ))}
            </g>
            {faiscas.map((f, i) => (
              <polygon key={`r${i}`} points={traco(f, f.w, 1)} fill={COR_RAIO.coral} fillOpacity={f.a} />
            ))}
            {faiscas.map((f, i) => (
              <polygon key={`q${i}`} points={traco(f, f.w * 0.8, 0.45)} fill={f.cor} fillOpacity={f.a} />
            ))}
            {faiscas.map((f, i) => (
              <circle key={`c${i}`} cx={f.hx} cy={f.hy} r={f.w * 0.42} fill={f.cor} fillOpacity={f.a} />
            ))}
          </g>
        )}
        {clarao > 0.001 && <circle cx={Q.x} cy={Q.y} r={380} fill={`url(#${reg}-clarao)`} opacity={clarao} />}
        {escVS > 0.001 && opVS > 0.001 && (
          <g transform={`translate(${Q.x.toFixed(2)} ${Q.y.toFixed(2)}) rotate(${giro.toFixed(3)}) scale(${escVS.toFixed(4)})`} opacity={opVS}>
            <text {...fonteVS} textAnchor="middle" dominantBaseline="central" fill={COR_RAIO.coral6} opacity={Math.min(1, 0.5 * pisca)} filter={`url(#${reg}-vsLonge)`}>{texto}</text>
            <text {...fonteVS} textAnchor="middle" dominantBaseline="central" fill={COR_RAIO.coral} opacity={Math.min(1, 0.85 * pisca)} filter={`url(#${reg}-vsPerto)`}>{texto}</text>
            <text {...fonteVS} textAnchor="middle" dominantBaseline="central" fill={COR_RAIO.tinta} opacity={0.18} transform="translate(0 9)" filter={`url(#${reg}-vsSombra)`}>{texto}</text>
            <text {...fonteVS} textAnchor="middle" dominantBaseline="central" fill={COR_RAIO.miolo} stroke={COR_RAIO.tinta} strokeWidth={tam * 0.024} strokeLinejoin="round" paintOrder="stroke">{texto}</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
// entre o 3D e a legenda (o KitMotion lê esta marca)
CamadaDivisor.sobLegenda = true;

export const render: RenderExtensao = {
  objetos: { [TIPO_PALCO]: fabricaPalco, argila: fabricaArgila },
  camadas: { "pilula-comenta": CamadaPilula, "divisor-vs": CamadaDivisor },
};
