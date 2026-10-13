// Reel "Cinco motivos" de 40 s em UM TAKE SÓ (13/10/2026). Pedido do Pedro: "não é para cortar a tela com a linha, e sim
// para o vídeo ser um take só e que tem uma linha guiando cada parte do vídeo".
// O mundo é uma tela de papel de 1080 de largura: as 26 partes (estacoes40.json, de cinco-motivos-ae/manual-40s/
// estacoes40.py) ficam uma embaixo da outra, a cada PASSO px; as partes que eram de fundo escuro viram cartões escuros
// dentro do mundo. A linha (a fita cinza da referência, com a ponta coral) desce pela margem de cada parte (esquerda nas
// ímpares, direita nas pares), cruza em S no vão entre uma parte e outra, sem passar por texto, e termina encostando
// na pílula LINK DA BIO do fecho. A câmera segue: anda devagar enquanto a parte fala e viaja pra próxima no fim dela,
// abrindo o zoom e inclinando, com motion blur. Cada texto pula quando é dito. O som vem do After Effects
// (manual-40s/saida/som-40s.aif, cortado e mixado pelo MCP) e entra no take40.sh.
import React from "react";
import { AbsoluteFill, Img, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/fonts";
import DADOS from "./estacoes40.json";

type Texto = { tx: string; fonte: "sora" | "serif"; px: number; cor: string; x: number; y: number; track: number; de: number; destaque: boolean; brilho: boolean; w: number };
type Imagem = { src: string; w: number; h: number; x: number; y: number; giro: number };
type Estacao = {
  n: number; de: number; ate: number; cartao: boolean; textos: Texto[]; imagens: Imagem[];
  celular: { i0: number; x: number; y: number } | null; pilula: { x: number; y: number; w: number; h: number; de: number } | null; fecho: boolean;
};
const DD = DADOS as unknown as { fps: number; total: number; fecho: number; estacoes: Estacao[] };
const ES = DD.estacoes;
const TOTAL = DD.total, FI = DD.fecho;
const C = { papel: "#FAF8F5", tinta: "#15171C", coral: "#F2643C", fita: "#D3CBBF", ponto: "#D9D2C7" };

let fontes = false;
const pedeFontes = () => {
  if (fontes) return;
  fontes = true;
  loadFont({ family: "Sora", url: staticFile("Sora-wght.ttf"), weight: "100 800" });
  loadFont({ family: "DM Serif Display", url: staticFile("fontes/DMSerifDisplay-Italic.ttf"), style: "italic", weight: "400" });
};

const cl = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x: number, s = 1.6) => { const y = x - 1; return 1 + (s + 1) * y * y * y + s * y * y; };

// ---------- o mundo ----------
const PASSO = 2500;
const cy = (k: number) => 960 + (k - 1) * PASSO; // k de 1 a 26
const lado = (k: number) => (k % 2 ? 46 : 1034);
const N = ES.length;
const A = (k: number) => (k === 1 ? 0 : k > N ? TOTAL : ES[k - 1].de); // a câmera chega na parte k
const viagem = (k: number) => Math.max(8, Math.min(16, Math.round(0.45 * (ES[k - 1].ate - ES[k - 1].de))));
const S = (k: number) => (k === N ? TOTAL : ES[k - 1].ate - viagem(k)); // a câmera sai da parte k

// a linha: amostras do caminho e o comprimento acumulado
type P = [number, number];
const PTS: P[] = [];
const LEN: number[] = [];
const empurra = (p: P) => {
  if (PTS.length) { const [x0, y0] = PTS[PTS.length - 1]; LEN.push(LEN[LEN.length - 1] + Math.hypot(p[0] - x0, p[1] - y0)); } else LEN.push(0);
  PTS.push(p);
};
const bez = (p0: P, p1: P, p2: P, p3: P, n: number) => {
  for (let i = 1; i <= n; i++) {
    const u = i / n, v = 1 - u;
    empurra([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]);
  }
};
const TOPO: number[] = [], FUNDO: number[] = [];
const PILULA_FECHO: P = [540, 35]; // centro da pílula do fecho, relativo ao centro da parte 26
for (let k = 1; k <= N; k++) {
  const x = lado(k);
  if (k === 1) empurra([x, cy(1) - 1000]);
  TOPO[k] = LEN[LEN.length - 1];
  if (k < N) {
    empurra([x, cy(k) + 1000]);
    FUNDO[k] = LEN[LEN.length - 1];
    bez([x, cy(k) + 1000], [x, cy(k) + 1250], [lado(k + 1), cy(k) + 1250], [lado(k + 1), cy(k + 1) - 1000], 28);
  } else {
    // a última desce pela margem ao lado do logo e vira pra encostar na pílula
    empurra([x, cy(k) - 60]);
    FUNDO[k] = LEN[LEN.length - 1];
    bez([x, cy(k) - 60], [x, cy(k) + PILULA_FECHO[1]], [x - 140, cy(k) + PILULA_FECHO[1]], [705 + 36, cy(k) + PILULA_FECHO[1]], 20);
  }
}
const COMPR = LEN[LEN.length - 1];
const D = "M " + PTS.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
const pontoEm = (l: number): P => {
  if (l <= 0) return PTS[0];
  if (l >= COMPR) return PTS[PTS.length - 1];
  let a = 0, b = LEN.length - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (LEN[m] < l) a = m; else b = m; }
  const u = (l - LEN[a]) / (LEN[b] - LEN[a]);
  return [lerp(PTS[a][0], PTS[b][0], u), lerp(PTS[a][1], PTS[b][1], u)];
};

// onde está a ponta da linha: desce a margem enquanto a parte fala e cruza o vão um pouco à frente da câmera
const cabeca = (f: number) => {
  for (let k = 1; k <= N; k++) {
    const a = A(k), s = S(k), run = FUNDO[k] - TOPO[k], entra = k === 1 ? TOPO[1] : TOPO[k] + 0.45 * run;
    if (k === N) {
      if (f < a) break;
      const fim = FI + 34;
      return f >= fim ? COMPR : lerp(entra, COMPR, eInOut(cl((f - a) / (fim - a))));
    }
    if (f < a) continue;
    if (f < s) return lerp(entra, FUNDO[k], (f - a) / (s - a));
    const prox = A(k + 1);
    if (f < prox) {
      const alvo = TOPO[k + 1] + 0.45 * (FUNDO[k + 1] - TOPO[k + 1]);
      return lerp(FUNDO[k], alvo, eInOut(cl(((f - s) / (prox - s)) * 1.2)));
    }
  }
  return TOPO[1];
};

// a câmera: anda 70 px e fecha 3,5% enquanto a parte fala; na viagem abre o zoom, desvia pro lado da curva e inclina
const camera = (f: number) => {
  for (let k = 1; k <= N; k++) {
    const a = A(k), s = S(k), prox = A(k + 1);
    if (f >= prox && k < N) continue;
    if (f < s || k === N) {
      const u = cl((f - a) / Math.max(1, (k === N ? TOTAL : s) - a));
      return { x: 540, y: cy(k) + 70 * u, z: 1 + 0.035 * u, r: 0 };
    }
    const q = eInOut(cl((f - s) / (prox - s))), sn = Math.sin(Math.PI * q), dir = k % 2 ? 1 : -1;
    return { x: 540 + dir * 150 * sn, y: lerp(cy(k) + 70, cy(k + 1), q), z: lerp(1.035, 1, q) * (1 - 0.2 * sn), r: dir * 2.5 * sn };
  }
  return { x: 540, y: cy(1), z: 1, r: 0 };
};

const pulo = (f: number, de: number) => 0.6 + 0.4 * eBack(cl((f - de) / 7));
const fonteDe = (t: Texto): React.CSSProperties =>
  t.fonte === "sora" ? { fontFamily: "Sora", fontWeight: 800 } : { fontFamily: "DM Serif Display", fontStyle: "italic", fontWeight: 400 };

const Parte: React.FC<{ e: Estacao; f: number; fr: number; perto: number }> = ({ e, f, fr, perto }) => {
  const oy = cy(e.n) - 960;
  return (
    <>
      {e.cartao && (
        <div
          style={{
            position: "absolute", left: 100, top: oy + 460, width: 880, height: 1000, borderRadius: 56, overflow: "hidden",
            background: "radial-gradient(ellipse 70% 55% at 50% 42%, #2C303A 0%, #1A1D23 55%, #0E0F12 100%)",
            boxShadow: "0 34px 70px rgba(21,23,28,0.26)", transform: `rotate(${(1 - perto) * (e.n % 4 === 0 ? 3 : -3)}deg) scale(${0.93 + 0.07 * perto})`,
          }}
        >
          <Img src={staticFile("ruido40.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.06, mixBlendMode: "screen" }} />
        </div>
      )}
      {e.imagens.map((im, i) => f >= e.de && (
        <Img key={i} src={staticFile(im.src)} style={{
          position: "absolute", left: im.x - im.w / 2, top: oy + im.y - im.h / 2, width: im.w, height: im.h, borderRadius: 26,
          boxShadow: "0 24px 50px rgba(21,23,28,0.22)", transform: `rotate(${im.giro}deg) scale(${pulo(f, e.de)})`,
        }} />
      ))}
      {e.celular && f >= e.de && (
        <Img
          src={staticFile(`cel17v7/cel_${String(Math.min(461, Math.max(0, e.celular.i0 + (fr - e.de)))).padStart(4, "0")}.png`)}
          style={{ position: "absolute", left: e.celular.x - 288, top: oy + e.celular.y - 432, width: 576, height: 864, filter: e.cartao ? undefined : "drop-shadow(0px 28px 36px rgba(21,23,28,0.28))" }}
        />
      )}
      {e.pilula && f >= e.pilula.de && (
        <div style={{
          position: "absolute", left: e.pilula.x - e.pilula.w / 2, top: oy + e.pilula.y - e.pilula.h / 2, width: e.pilula.w, height: e.pilula.h,
          borderRadius: e.pilula.h / 2, background: C.coral, boxShadow: "0 16px 34px rgba(221,78,39,0.3)",
          transform: `scale(${pulo(f, e.pilula.de)}) rotate(${-4 * (1 - eInOut(cl((f - e.pilula.de) / 7)))}deg)`,
        }} />
      )}
      {e.textos.map((t, i) => f >= t.de && (
        <div key={i} style={{
          position: "absolute", left: t.x, top: oy + t.y, whiteSpace: "nowrap", fontSize: t.px, lineHeight: 1, color: t.cor, letterSpacing: `${t.track}em`,
          transform: `translate(-50%, -50%) scale(${pulo(f, t.de)}) rotate(${t.destaque ? -4 * (1 - eInOut(cl((f - t.de) / 7))) : 0}deg)`,
          textShadow: t.brilho ? "0 0 30px rgba(242,100,60,0.55)" : undefined, ...fonteDe(t),
        }}>{t.tx}</div>
      ))}
      {e.fecho && f >= e.de && <Fecho f={f} oy={oy} de={e.de} />}
    </>
  );
};

// fecho: "Vai," + logo (o "aí" acende quando é dito) e a pílula LINK DA BIO pequena, onde a linha termina
const W_VAI = 198, X0 = 540 - (W_VAI + 28 + 590) / 2;
const Fecho: React.FC<{ f: number; oy: number; de: number }> = ({ f, oy, de }) => {
  const s = pulo(f, de), ai = cl((f - (FI + 28)) / 4), tp = FI + 38;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: oy, width: 1080, height: 1920, transformOrigin: "540px 822px", transform: `scale(${s})` }}>
        <div style={{ position: "absolute", left: X0, top: 828, transform: "translateY(-50%)", fontFamily: "Sora", fontWeight: 800, fontSize: 106, letterSpacing: "-0.035em", lineHeight: 1, color: C.tinta, whiteSpace: "nowrap" }}>Vai,</div>
        <Img src={staticFile("marca/logo-ai-tinta.svg")} style={{ position: "absolute", left: X0 + W_VAI + 28, top: 822 - 58, width: 590 }} />
        <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: X0 + W_VAI + 28, top: 822 - 58, width: 590, opacity: ai }} />
      </div>
      {f >= tp && (
        <div style={{ position: "absolute", left: 540 - 165, top: oy + 995 - 35, width: 330, height: 70, borderRadius: 35, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulo(f, tp)})`, boxShadow: "0 12px 26px rgba(221,78,39,0.28)" }}>
          <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 34, letterSpacing: "0.06em", color: "#FFFFFF", lineHeight: 1 }}>LINK DA BIO</span>
        </div>
      )}
    </>
  );
};

const Mundo: React.FC<{ fr: number }> = ({ fr }) => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const head = cabeca(f);
  const [hx, hy] = pontoEm(head);
  const tf = `translate(540px, 960px) rotate(${cam.r}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`;
  const gx = Math.floor((cam.x - 2200) / 52) * 52, gy = Math.floor((cam.y - 2800) / 52) * 52;
  return (
    <AbsoluteFill style={{ backgroundColor: C.papel, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: tf }}>
        <div style={{ position: "absolute", left: gx, top: gy, width: 4400, height: 5600, opacity: 0.55, backgroundImage: `radial-gradient(circle, ${C.ponto} 0px, ${C.ponto} 2.4px, rgba(217,210,199,0) 3px)`, backgroundSize: "52px 52px" }} />
        <svg width={1080} height={cy(N) + 1200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* sombra barata (filtro num caminho de 65 mil px seria lento): o mesmo caminho 12 px abaixo, quase transparente */}
          <path d={D} transform="translate(0 12)" fill="none" stroke="rgba(21,23,28,0.07)" strokeWidth={72} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${COMPR} ${COMPR}`} strokeDashoffset={COMPR - head} />
          <path d={D} fill="none" stroke={C.fita} strokeWidth={64} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${COMPR} ${COMPR}`} strokeDashoffset={COMPR - head} />
          <circle cx={hx} cy={hy} r={27} fill={C.coral} />
        </svg>
        {ES.map((e) => {
          const d = Math.abs(cam.y - cy(e.n));
          if (d > 3200) return null;
          return <Parte key={e.n} e={e} f={f} fr={fr} perto={cl(1 - d / PASSO)} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Cinco40Take: React.FC = () => {
  pedeFontes();
  const fr = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  return isRendering ? (
    <HtmlInCanvasMotionBlur width={1080} height={1920} samples={8} shutterAngle={200}>
      <Mundo fr={fr} />
    </HtmlInCanvasMotionBlur>
  ) : (
    <Mundo fr={fr} />
  );
};
