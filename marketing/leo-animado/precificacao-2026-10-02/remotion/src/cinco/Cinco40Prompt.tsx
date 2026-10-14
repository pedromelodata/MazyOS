// Reel "Cinco motivos pra ter CNPJ" (13/10/2026) feito a partir do prompt que o Pedro colou ("Use esse prompt para
// criar o vídeo no Remotion mas usando as nossas cores e assets"): tipografia cinética editorial que alterna set de
// papel quente com vazio preto com brilho, câmera que nunca para (empurrão com ease-out exponencial, um giro que vira
// corte, motion blur no que se mexe), cortes secos, clarões brancos, uma cintilação de exposição, duas íris pretas,
// o disco que estoura debaixo do "6%", o cartão cinza preso com tachinha, a tela presa com fita crepe, cópias
// desfocadas saindo pelos cantos, a faixa cinza em S e o piso em perspectiva no preto.
// Trocas pela marca: vermelho -> coral #F2643C, Inter -> Sora (regra da marca), lâmpada/maleta/emoji -> recortes de
// argila, iPhone 3D, telas reais do app e o símbolo da marca no lugar da borboleta. Por regra do Pedro, palavra entra
// sem desfoque (opacidade, deslize e o coral acendendo), sem efeito sonoro, e o fecho "Vai, Legalizaí" fica.
// Tudo vem do prompt40.json (cinco-motivos-ae/manual-40s/prompt40.py): as batidas, o quadro de cada palavra (3 antes
// de ser dita, na narração nova numa tomada só) e a posição de cada palavra, medida com a Sora de verdade.
// Três camadas: o fundo (sem blur, que mexe devagar), o que se mexe (com motion blur) e as passagens (sem blur, porque
// disco e íris abrindo milhares de px em poucos quadros viram anéis nas amostras).
import React from "react";
import { AbsoluteFill, Img, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/fonts";
import DADOS from "./prompt40.json";

type Estilo = "set" | "key" | "small" | "charcoal" | "simbolo";
type Pal = { t: string; e: Estilo; px: number; w: number; x: number; a: number };
type Linha = { b: number; pal: Pal[]; cheg: number[][]; w: number; cx: number; fim?: number };
type Num = { t: string; px: number; x: number; b: number; a: number; w: number };
type Prop = { src: string; x: number; y: number; tam: number; rot: number };
type Batida = {
  n: number; tipo: string; fundo: "papel" | "preto"; de: number; ate: number;
  cam: { s1: number; k: number; px: number; py: number };
  saida?: string | null; entrada?: string | null;
  linhas: Linha[]; embaixo?: Linha[]; conta?: Linha[];
  voo?: { p0: number[]; p1: number[]; p2: number[]; a0: number; a1: number; tam: number };
  prop?: Prop; barras?: number[]; selos?: { x: number; y: number; esc: number }; grade?: number[];
  cabeca?: { x: number; y: number; r: number }; num?: Num; iris?: number[]; faixa?: "S" | "arco";
  cartao?: { x: number; y: number; w: number; h: number; tpx: number; titulo: string; ta: number; rows: { icone: string; t: string; a: number; px: number }[] };
  script?: { t: string; px: number; w: number; x: number; b: number; a: number }; disco?: number[];
  tela?: { src: string; x: number; y: number; w: number; h: number; rot: number };
  cel?: { x: number; y: number; w: number; i0: number };
  pilula?: { x: number; y: number; w: number; h: number; a: number };
  mao?: { src: string; tam: number; ponta: number[]; pf: number[]; a: number };
  moeda?: { src: string; x: number; y: number; d: number; a: number };
  cofrinho?: { src: string; x: number; y: number; tam: number; moeda: string; a: number };
  seq?: { pasta: string; n: number };
  meses?: { n: number; x0: number; w: number; gap: number; base: number; h: number; a: number; st: number; dur: number; la: number; rotulos: string };
  cal?: { x: number; y: number; w: number; h: number; mes: string; dias: number[]; tr: number[] };
  dataFim?: { t: string; a: number };
  barra?: { x: number; w: number; y: number; h: number; d: number; moeda: string; ma: number; va: number; f0: number; f1: number; ta: number; cpx: number; cb: number; marcas: number[]; meses?: number; et?: number };
  ai?: number; tp?: number;
};
const D = DADOS as unknown as { total: number; batidas: Batida[] };
export const TOTAL_PROMPT = D.total;
const achar = (fr: number) => D.batidas.find((x) => fr >= x.de && fr < x.ate) ?? D.batidas[D.batidas.length - 1];

const C = {
  papel: "#FAF8F5", papel2: "#F1ECE4", preto: "#0E0F12", haze: "#23262E", tinta: "#15171C", carvao: "#3F3F40",
  coral: "#F2643C", coralClaro: "#F9C6B4", faixa: "#D6CEC2", grade: "#DED7CC", no: "#CAC2B6", cartao: "#8E8984",
  divisor: "#3D3D3D", fita: "#C9A878", rosa: "#F7C4B4", blush: "#FBE6DC",
};

let fontes = false;
const pedeFontes = () => {
  if (fontes) return;
  fontes = true;
  loadFont({ family: "Sora", url: staticFile("Sora-wght.ttf"), weight: "100 800" });
  loadFont({ family: "DM Serif Display", url: staticFile("fontes/DMSerifDisplay-Italic.ttf"), style: "italic", weight: "400" });
};

const cl = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const eOut = (x: number) => 1 - Math.pow(1 - x, 3);
const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x: number, s = 1.7) => { const y = x - 1; return 1 + (s + 1) * y * y * y + s * y * y; };
const pop = (f: number, a: number, n = 7) => 0.6 + 0.4 * eBack(cl((f - a) / n));
// empurrão com ease-out exponencial que termina no fim da batida (k=4,3/s deixa 70% feito em 0,28 s)
const expo = (t: number, T: number, k: number) => (1 - Math.exp(-k * t)) / (1 - Math.exp(-k * Math.max(T, 0.01)));
const mixHex = (a: string, b: string, x: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return `rgb(${Math.round(lerp(r1, r2, x))},${Math.round(lerp(g1, g2, x))},${Math.round(lerp(b1, b2, x))})`;
};

// ---------- tipografia: cada palavra no lugar que o prompt40.py mediu; a linha se recentra quando entra palavra ----------
const ESTILO: Record<string, { peso: number; track: number }> = {
  set: { peso: 600, track: -0.02 }, key: { peso: 800, track: -0.05 }, small: { peso: 600, track: 0 }, charcoal: { peso: 500, track: -0.02 },
};
const ASC = 0.84; // Sora com line-height 1: do topo da caixa até a linha de base, em em
const Palavra: React.FC<{ p: Pal; f: number; left: number; b: number; escuro: boolean }> = ({ p, f, left, b, escuro }) => {
  if (p.e === "simbolo" || f < p.a) return null;
  const k = cl((f - p.a) / 3), key = p.e === "key";
  const base = p.e === "charcoal" || p.e === "small" ? (escuro ? "#E6E4E0" : C.carvao) : escuro ? "#FFFFFF" : C.tinta;
  const cor = key ? mixHex(C.coralClaro, C.coral, k) : base;
  const brilho = escuro ? (key ? `0 0 54px rgba(242,100,60,${0.8 * k}), 0 0 18px rgba(242,100,60,${0.55 * k})` : `0 0 21px rgba(255,255,255,${0.45 * k})`) : undefined;
  const es = ESTILO[p.e];
  return (
    <span style={{
      position: "absolute", left: left + p.x, top: b - ASC * p.px, fontFamily: "Sora", fontWeight: es.peso, fontSize: p.px, lineHeight: 1,
      letterSpacing: `${es.track}em`, color: cor, textShadow: brilho, opacity: lerp(0.4, 1, k), whiteSpace: "nowrap",
      transform: `translate(${15 * (1 - k)}px, ${15 * (1 - k)}px)`,
    }}>{p.t}</span>
  );
};
// a linha fica no lugar da linha completa: recentrar a cada palavra que chega arrastava a linha uns 100 px por quadro
// e o motion blur borrava a palavra na chegada por 3 quadros (o Pedro não quer desfoque de chegada)
const esquerda = (l: Linha) => l.cheg[l.cheg.length - 1][1];
const Linhas: React.FC<{ ls?: Linha[]; f: number; escuro: boolean; dx?: number }> = ({ ls, f, escuro, dx = 0 }) => (
  <>
    {(ls ?? []).map((l, i) => {
      if (l.fim !== undefined && f >= l.fim) return null;
      const x = esquerda(l) + dx;
      return l.pal.map((p, j) => <Palavra key={`${i}-${j}`} p={p} f={f} left={x} b={l.b} escuro={escuro} />);
    })}
  </>
);

// ---------- peças ----------
const Simbolo: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 211.09 211.09" style={{ display: "block" }}>
    <rect fill={C.coral} width={211.09} height={211.09} rx={32.84} ry={32.84} />
    <path fill="#FFFFFF" d="M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87Z" />
  </svg>
);
// o símbolo sai voando de trás do recorte, tremulando, e pousa no fim de "trabalho" (no lugar da borboleta)
const Voo: React.FC<{ v: NonNullable<Batida["voo"]>; f: number }> = ({ v, f }) => {
  if (f < v.a0) return null;
  const u = eInOut(cl((f - v.a0) / (v.a1 - v.a0)));
  const q = (a: number, b: number, c: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  const x = q(v.p0[0], v.p1[0], v.p2[0]), y = q(v.p0[1], v.p1[1], v.p2[1]), vida = 1 - u;
  const rot = Math.sin(f * 0.9) * 22 * vida;
  const sq = f >= v.a1 ? 1 + 0.12 * Math.sin(cl((f - v.a1) / 6) * Math.PI) : 1 + Math.sin(f * 1.7) * 0.1 * vida;
  const tam = v.tam * lerp(0.7, 1, u);
  return (
    <div style={{ position: "absolute", left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, transform: `rotate(${rot}deg) scale(${sq})`, filter: "drop-shadow(4px 8px 8px rgba(21,23,28,0.22))" }}>
      <Simbolo tam={tam} />
    </div>
  );
};
const Recorte: React.FC<{ p: Prop; f: number; de: number; entra?: boolean; desfoque?: number }> = ({ p, f, de, entra, desfoque = 0 }) => {
  const s = entra ? pop(f, de, 8) : 1, fl = Math.sin((f - de) / 9) * 8;
  return (
    <Img src={staticFile(p.src)} style={{
      position: "absolute", left: p.x - p.tam / 2, top: p.y - p.tam / 2, width: p.tam, height: p.tam,
      transform: `translateY(${fl}px) rotate(${p.rot + Math.sin((f - de) / 20) * 1.5}deg) scale(${s})`,
      filter: `${desfoque > 0.05 ? `blur(${desfoque}px) ` : ""}drop-shadow(18px 28px 24px rgba(120,100,80,0.3))`,
    }} />
  );
};
const Tachinha: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: `radial-gradient(circle at 34% 30%, #FFD9CC 0%, ${C.coral} 32%, #B83D1C 100%)`, boxShadow: "6px 10px 14px rgba(21,23,28,0.35)" }} />
);
const Icone: React.FC<{ nome: string; tam: number }> = ({ nome, tam }) => {
  const s = { width: tam, height: tam };
  if (nome === "moedas") return <svg {...s} viewBox="0 0 50 50"><ellipse cx={25} cy={36} rx={17} ry={6} fill="#0B0705" /><rect x={8} y={20} width={34} height={16} fill="#0B0705" /><ellipse cx={25} cy={20} rx={17} ry={6} fill="#0B0705" /><ellipse cx={25} cy={20} rx={11} ry={3.4} fill="#5A5550" /></svg>;
  return <svg {...s} viewBox="0 0 50 50"><rect x={6} y={10} width={38} height={34} rx={5} fill="#0B0705" /><rect x={12} y={5} width={5} height={10} rx={2} fill="#0B0705" /><rect x={33} y={5} width={5} height={10} rx={2} fill="#0B0705" /></svg>;
};
// o empresário sem rosto do prompt: cabeça branca que brilha e o busto preto em meio-tom, mais denso na borda
const Corpo: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => {
  const t = y + r + 16;
  const d = `M ${x - 74} ${t} C ${x - 74} ${t + 52}, ${x - 236} ${t + 62}, ${x - 318} ${t + 102} C ${x - 390} ${t + 138}, ${x - 410} ${t + 214}, ${x - 416} ${t + 312} L ${x - 436} 1990 L ${x + 436} 1990 L ${x + 416} ${t + 312} C ${x + 410} ${t + 214}, ${x + 390} ${t + 138}, ${x + 318} ${t + 102} C ${x + 236} ${t + 62}, ${x + 74} ${t + 52}, ${x + 74} ${t} Z`;
  const gravata = `M ${x - 14} ${t + 52} L ${x + 14} ${t + 52} L ${x + 25} ${t + 300} L ${x} ${t + 348} L ${x - 25} ${t + 300} Z`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <pattern id="c40meio" width={15} height={15} patternUnits="userSpaceOnUse"><circle cx={7.5} cy={7.5} r={3.2} fill="#FFFFFF" /></pattern>
        <pattern id="c40bola" width={22} height={22} patternUnits="userSpaceOnUse"><circle cx={11} cy={11} r={4} fill="#FFFFFF" /></pattern>
        <filter id="c40borra" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={26} /></filter>
        <linearGradient id="c40desce" x1="0" y1={t} x2="0" y2={1900} gradientUnits="userSpaceOnUse"><stop offset="0.3" stopColor="#FFFFFF" /><stop offset="1" stopColor="#000000" /></linearGradient>
        <mask id="c40aro" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect x={0} y={0} width={1080} height={1920} fill="#000000" />
          <path d={d} fill="#FFFFFF" fillOpacity={0.16} />
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={130} filter="url(#c40borra)" />
        </mask>
        <mask id="c40fade" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}><rect x={0} y={0} width={1080} height={1920} fill="url(#c40desce)" /></mask>
        <clipPath id="c40sil"><path d={d} /></clipPath>
      </defs>
      <g mask="url(#c40fade)">
        <path d={d} fill="#1E1D1D" />
        <g clipPath="url(#c40sil)"><rect x={0} y={0} width={1080} height={1920} fill="url(#c40meio)" mask="url(#c40aro)" /></g>
        <path d={`M ${x - 64} ${t} L ${x} ${t + 150} L ${x + 64} ${t} Z`} fill="#FFFFFF" />
        <path d={gravata} fill="#1E1D1D" />
        <path d={gravata} fill="url(#c40bola)" opacity={0.75} />
      </g>
    </svg>
  );
};
const Tela: React.FC<{ src: string; w: number; h: number; raio?: number }> = ({ src, w, h, raio = 26 }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, borderRadius: raio, boxShadow: "22px 30px 40px rgba(80,64,48,0.3), 0 0 0 1px rgba(21,23,28,0.06)" }} />
);

// ---------- cenário (camada de trás, sem blur) ----------
const Papel: React.FC = () => <div style={{ position: "absolute", inset: -420, background: `radial-gradient(ellipse 80% 60% at 30% 25%, #FFFDFA 0%, ${C.papel} 48%, ${C.papel2} 100%)` }} />;
const Preto: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: -420, background: `radial-gradient(ellipse 48% 34% at 50% 48%, ${C.haze} 0%, #15171C 50%, ${C.preto} 100%)` }} />
    <div style={{ position: "absolute", inset: -420, backgroundImage: `url(${staticFile("ruido40.png")})`, backgroundSize: "256px 256px", opacity: 0.05, mixBlendMode: "screen" }} />
  </>
);
const Grade: React.FC<{ top: number; h: number; op?: number }> = ({ top, h, op = 1 }) => (
  <div style={{
    position: "absolute", left: 0, right: 0, top, height: h, opacity: op,
    backgroundImage: `radial-gradient(circle, ${C.no} 0px, ${C.no} 2.6px, transparent 3.2px), linear-gradient(${C.grade} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.grade} 1.5px, transparent 1.5px)`,
    backgroundSize: "69px 69px", backgroundPosition: "-1px -1px", maskImage: "linear-gradient(transparent, black 18%, black 82%, transparent)",
  }} />
);
const PisoPreto: React.FC = () => (
  <div style={{
    position: "absolute", left: -1080, right: -1080, top: 1060, height: 1500, transform: "perspective(900px) rotateX(68deg)", transformOrigin: "50% 0%",
    backgroundImage: "radial-gradient(circle, #3A3D46 0px, #3A3D46 3px, transparent 3.6px), linear-gradient(#25272E 2px, transparent 2px), linear-gradient(90deg, #25272E 2px, transparent 2px)",
    backgroundSize: "120px 120px", maskImage: "linear-gradient(transparent, black 30%)",
  }} />
);
// a faixa cinza grossa: S de cima à esquerda até embaixo à direita, ou o "(" grande do cartão
const Faixa: React.FC<{ forma: "S" | "arco"; f: number; de: number }> = ({ forma, f, de }) => {
  const d = forma === "S" ? "M -140 250 C 520 210, 660 760, 520 980 S 420 1650, 1240 1730" : "M 250 -100 C -60 520, -60 1380, 1200 2000";
  const k = eOut(cl((f - de) / 8));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, filter: "blur(2px)", overflow: "visible" }}>
      <path d={d} fill="none" stroke={C.faixa} strokeWidth={forma === "S" ? 195 : 225} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
    </svg>
  );
};
// cópias desfocadas do ícone saindo pelos cantos (de cima à direita e de baixo à esquerda)
const Copias: React.FC<{ b: Batida; f: number }> = ({ b, f }) => {
  const g = (f - b.de) / 14;
  if (b.num) {
    const st: React.CSSProperties = { position: "absolute", fontFamily: "Sora", fontWeight: 800, fontSize: 900, lineHeight: 1, color: C.coral, opacity: 0.5, filter: "blur(12px)", whiteSpace: "nowrap" };
    return (
      <>
        <div style={{ ...st, left: 700, top: -230, transform: `rotate(${12 + Math.sin(g) * 2}deg)` }}>{b.num.t}</div>
        <div style={{ ...st, left: -170, top: 1440, transform: `rotate(${-10 + Math.sin(g * 0.9) * 2}deg)` }}>{b.num.t}</div>
      </>
    );
  }
  if (!b.prop) return null;
  const st: React.CSSProperties = { position: "absolute", width: 680, height: 680, opacity: 0.6, filter: "blur(12px)" };
  return (
    <>
      <Img src={staticFile(b.prop.src)} style={{ ...st, left: 620, top: -200, transform: `rotate(${10 + Math.sin(g) * 2}deg)` }} />
      <Img src={staticFile(b.prop.src)} style={{ ...st, left: -280, top: 1420, transform: `rotate(${-12 + Math.sin(g * 0.9) * 2}deg)` }} />
    </>
  );
};
// o disco translúcido que estoura de baixo do "6%" e passa da tela, deixando um rubor que volta pro papel
const Disco: React.FC<{ b: Batida; f: number }> = ({ b, f }) => {
  if (!b.script || !b.disco) return null;
  const a = b.script.a + 3, kd = cl((f - a) / 7), kw = cl((f - (a + 7)) / 12);
  if (kd <= 0) return null;
  if (kd < 1) {
    const r = 1450 * Math.pow(kd, 1.2);
    return <div style={{ position: "absolute", left: b.disco[0] - r, top: b.disco[1] - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "rgba(242,100,60,0.35)", border: `9px solid ${C.coral}` }} />;
  }
  return kw < 1 ? <AbsoluteFill style={{ background: kw < 0.25 ? mixHex(C.rosa, C.blush, kw / 0.25) : mixHex(C.blush, C.papel, eInOut((kw - 0.25) / 0.75)) }} /> : null;
};
const Fundo: React.FC<{ b: Batida; f: number }> = ({ b, f }) => (
  <>
    {b.fundo === "preto" ? <Preto /> : <Papel />}
    {b.grade && <Grade top={b.grade[0]} h={b.grade[1]} />}
    {b.tipo === "icone" && <Grade top={760} h={760} op={0.55} />}
    {b.faixa && <Faixa forma={b.faixa} f={f} de={b.de} />}
    {(b.tipo === "rola" || b.tipo === "guia") && <PisoPreto />}
    {b.tipo === "icone" && <Copias b={b} f={f} />}
    {b.tipo === "script" && <Disco b={b} f={f} />}
    {b.tipo === "cabeca" && b.cabeca && <Corpo x={b.cabeca.x} y={b.cabeca.y} r={b.cabeca.r} />}
  </>
);

// ---------- o que se mexe (camada com motion blur) ----------
// número em 3D (liberdade criativa, 13/10): a Sora 800 extrudada em 26 camadas projetadas atrás da face, que escurecem
// com a profundidade; o número entra girado, assenta virado uns 15 graus, balança devagar e um brilho corre na face
const Num3D: React.FC<{ n: Num; f: number; de: number; escuro: boolean }> = ({ n, f, de, escuro }) => {
  if (f < n.a) return null;
  const k = eOut(cl((f - n.a) / 10)), vida = cl((f - n.a - 8) / 10);
  const th = lerp(-40, -15, k) + Math.sin((f - de) / 16) * 6 * vida, ph = lerp(16, 7, k) + Math.sin((f - de) / 21 + 1) * 3 * vida;
  const N = 26, passo = n.px * 0.0048, rad = Math.PI / 180;
  const sx = Math.cos(th * rad), dx = -Math.sin(th * rad) * passo, dy = -Math.sin(ph * rad) * passo;
  const hl = lerp(-30, 130, cl((f - n.a - 6) / 18));
  const base: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: n.w, textAlign: "center", fontFamily: "Sora", fontWeight: 800, fontSize: n.px, lineHeight: 1, letterSpacing: "-0.05em", whiteSpace: "nowrap", transformOrigin: "50% 50%" };
  return (
    <div style={{ position: "absolute", left: n.x, top: n.b - ASC * n.px, width: n.w, height: n.px, transformOrigin: "50% 60%", transform: `translateY(${Math.sin((f - de) / 9) * 8}px) scale(${pop(f, n.a, 8)})`, filter: escuro ? "drop-shadow(0 0 46px rgba(242,100,60,0.45))" : "drop-shadow(18px 28px 22px rgba(150,60,30,0.26))" }}>
      {Array.from({ length: N }, (_, j) => N - j).map((i) => (
        <span key={i} style={{ ...base, color: mixHex(escuro ? "#D4502A" : "#DD5730", escuro ? "#5A1B0A" : "#87290F", i / N), transform: `translate(${dx * i}px, ${dy * i}px) scaleX(${sx})` }}>{n.t}</span>
      ))}
      <span style={{ ...base, transform: `scaleX(${sx})`, background: "linear-gradient(160deg, #FFB094 0%, #F2643C 46%, #C4441F 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{n.t}</span>
      <span style={{ ...base, transform: `scaleX(${sx})`, background: `linear-gradient(115deg, rgba(255,255,255,0) ${hl - 14}%, rgba(255,255,255,0.7) ${hl}%, rgba(255,255,255,0) ${hl + 14}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{n.t}</span>
    </div>
  );
};
// a moeda de 1 em 3D: a face (imagem do Higgsfield) encolhe com o cosseno do giro e a borda dourada vem em fatias
const Moeda3D: React.FC<{ m: NonNullable<Batida["moeda"]>; f: number }> = ({ m, f }) => {
  if (f < m.a) return null;
  const k = eOut(cl((f - m.a) / 12)), vida = cl((f - m.a - 12) / 8), rad = Math.PI / 180;
  const giro = lerp(900, 18, k) + Math.sin((f - m.a) / 10) * 16 * vida;
  const x = lerp(m.x + 430, m.x, k), y = lerp(m.y + 720, m.y, k) - Math.sin(k * Math.PI) * 140 + Math.sin((f - m.a) / 9) * 8 * vida;
  const c = Math.cos(giro * rad), sn = Math.sin(giro * rad), w = Math.max(2, m.d * Math.abs(c)), esp = m.d * 0.075, N = 12;
  return (
    <div style={{ position: "absolute", left: x - m.d / 2, top: y - m.d / 2, width: m.d, height: m.d, transform: `rotate(${lerp(-25, -6, k)}deg)`, filter: "drop-shadow(18px 30px 24px rgba(120,100,80,0.32))" }}>
      {Array.from({ length: N }, (_, i) => i).map((i) => (
        <div key={i} style={{ position: "absolute", left: (m.d - w) / 2 - sn * esp * (i / (N - 1) - 0.5), top: 0, width: w, height: m.d, borderRadius: "50%", background: `linear-gradient(90deg, #8C6A2A, ${i % 2 ? "#D9B45E" : "#C9A04C"} 50%, #8C6A2A)` }} />
      ))}
      <Img src={staticFile(m.src)} style={{ position: "absolute", left: (m.d - w) / 2 + sn * esp * 0.5, top: 0, width: w, height: m.d }} />
    </div>
  );
};
// o cofrinho coral entra estourando e uma moeda cai pela fenda no "INSS" (some atrás do corpo)
const Cofrinho: React.FC<{ c: NonNullable<Batida["cofrinho"]>; f: number; de: number; topo: number }> = ({ c, f, de, topo }) => {
  const fx = c.x - c.tam / 2 + 0.47 * c.tam, fy = c.y - c.tam / 2 + 0.23 * c.tam;
  const km = cl((f - c.a) / 6), dm = 118;
  const my = lerp(topo + 30 + dm / 2, fy + dm * 0.75, km * km);
  return (
    <>
      {f >= c.a && km < 1 && (
        <div style={{ position: "absolute", left: fx - dm / 2, top: my - dm / 2, width: dm, height: dm, transform: `scaleX(${Math.max(0.08, Math.abs(Math.cos((f - c.a) * 0.9)))})` }}>
          <Img src={staticFile(c.moeda)} style={{ width: dm, height: dm }} />
        </div>
      )}
      <Img src={staticFile(c.src)} style={{ position: "absolute", left: c.x - c.tam / 2, top: c.y - c.tam / 2, width: c.tam, height: c.tam, transformOrigin: "50% 70%", transform: `translateY(${Math.sin((f - de) / 9) * 7}px) rotate(${lerp(-12, 0, eOut(cl((f - de) / 9)))}deg) scale(${pop(f, de, 9) * (1 + 0.035 * Math.sin(cl((f - c.a - 5) / 6) * Math.PI))})`, filter: "drop-shadow(0 0 34px rgba(255,255,255,0.12))" }} />
    </>
  );
};
// a guia do MEI é a mesma todo mês (14/10, no lugar do calendário com cadeado): 12 barras de mês sobem na mesma
// altura, uma atrás da outra, e no "fixa." uma linha branca nivela as pontas. Sem valor nenhum na tela (F063)
const MesesGuia: React.FC<{ g: NonNullable<Batida["meses"]>; f: number }> = ({ g, f }) => {
  const tot = g.n * (g.w + g.gap) - g.gap;
  const kl = cl((f - g.la) / 6), pulso = f >= g.la ? 1 + 0.04 * Math.sin(cl((f - g.la) / 8) * Math.PI) : 1;
  return (
    <>
      {Array.from({ length: g.n }, (_, i) => {
        const k = cl((f - (g.a + i * g.st)) / g.dur);
        if (k <= 0) return null;
        const h = g.h * eBack(k, 1.4) * pulso;
        return <div key={i} style={{ position: "absolute", left: g.x0 + i * (g.w + g.gap), top: g.base - h, width: g.w, height: h, borderRadius: "12px 12px 4px 4px", background: "linear-gradient(180deg, #FF9C76 0%, #F2643C 55%, #C9472A 100%)", boxShadow: "0 0 26px rgba(242,100,60,0.4)" }} />;
      })}
      {g.rotulos.split("").map((m, i) => (
        <span key={i} style={{ position: "absolute", left: g.x0 + i * (g.w + g.gap), top: g.base + 16, width: g.w, textAlign: "center", fontFamily: "Sora", fontWeight: 600, fontSize: 28, lineHeight: 1, color: "#8E939C", opacity: cl((f - (g.a + i * g.st)) / 4) }}>{m}</span>
      ))}
      {kl > 0 && <div style={{ position: "absolute", left: g.x0 - 24, top: g.base - g.h * pulso - 4, width: (tot + 48) * eOut(kl), height: 8, borderRadius: 4, background: "#FFFFFF", boxShadow: "0 0 20px rgba(255,255,255,0.75)" }} />}
    </>
  );
};
// a barra do faturamento do MEI (14/10, "de 1 Real até 81000 por ano progressiva e animada" e "tem que ser gradual"):
// o contador aparece em R$ 1 no "um real"; a barra, dividida em 12 meses, sobe um degrau de R$ 6.750 por mês até o
// teto de R$ 81 mil, do "um real" ao fim do "mês"; a moeda de 1 rola na frente e, no "exatamente", a etiqueta
// "R$ 6.750 por mês" acompanha o degrau (F051: R$ 81.000 por ano, média de R$ 6.750 por mês)
const real = (v: number) => "R$ " + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const degraus = (f: number, f0: number, f1: number, n: number) => {
  if (f < f0) return 0;
  if (f >= f1) return 1;
  const passo = (f1 - f0) / n, k = Math.min(n - 1, Math.floor((f - f0) / passo));
  return (k + eOut(cl((f - (f0 + k * passo)) / (0.7 * passo)))) / n;
};
const BarraTeto: React.FC<{ r: NonNullable<Batida["barra"]>; f: number; fr: number }> = ({ r, f, fr }) => {
  const n = r.meses ?? 12, s0 = r.f0 + 8; // segura o R$ 1 uns 8 quadros antes do primeiro degrau
  const p = degraus(f, s0, r.f1, n);
  // o número do contador sai do quadro real: com o tempo das amostras do blur, os dígitos se misturavam e borravam
  const pn = degraus(fr, s0, r.f1, n);
  const cheio = f >= r.f1, bate = cheio ? Math.sin(cl((f - r.f1) / 7) * Math.PI) : 0;
  const kt = eOut(cl((f - r.ma) / 8)), topo = r.y - r.h / 2, R = r.d / 2, seg = (r.w - r.h) / n;
  const fillW = r.h + (r.w - r.h) * p;
  // a moeda entra pela esquerda girando, pousa na ponta do R$ 1 e depois rola junto com a frente do enchimento
  const km = eOut(cl((f - r.ma) / 12)), x0c = r.x + R, xFim = r.x + r.w - R - 6;
  const xr = f < s0 ? x0c : Math.min(xFim, Math.max(x0c, r.x + fillW - R));
  const entrando = f < r.ma + 12;
  const cx = entrando ? lerp(-170, x0c, km) : xr - 10 * bate;
  const cy = entrando ? lerp(topo - R - 250, topo - R, km) - Math.sin(km * Math.PI) * 70 : topo - R;
  const giro = entrando ? lerp(720, 0, km) : 0, roll = ((cx - x0c) / R) * (180 / Math.PI);
  const kv = cl((f - r.va) / 3), ket = r.et !== undefined ? cl((f - r.et) / 4) : 0;
  // a etiqueta fica embaixo do mês que está subindo (presa dentro da barra)
  const mesAtual = Math.min(n - 1, Math.floor(p * n - 1e-6)), tagW = 330;
  const tagX = Math.min(r.x + r.w - tagW, Math.max(r.x, r.x + r.h / 2 + seg * (mesAtual + 0.5) - tagW / 2));
  const st: React.CSSProperties = { position: "absolute", fontFamily: "Sora", lineHeight: 1, whiteSpace: "nowrap" };
  return (
    <>
      <div style={{ position: "absolute", left: r.x, top: topo, width: Math.max(r.h, r.w * kt), height: r.h, borderRadius: r.h / 2, background: "#ECE5DB", boxShadow: "inset 0 5px 12px rgba(80,64,48,0.18)", opacity: kt }} />
      {f >= r.va && (
        <div style={{ position: "absolute", left: r.x, top: topo, width: fillW, height: r.h, borderRadius: r.h / 2, background: "linear-gradient(180deg, #FF9F7A 0%, #F2643C 55%, #D24C27 100%)", boxShadow: `0 10px 24px rgba(242,100,60,${0.25 + 0.35 * bate})`, opacity: kv }}>
          <div style={{ position: "absolute", left: 16, right: 16, top: 10, height: r.h * 0.28, borderRadius: r.h, background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
        </div>
      )}
      {Array.from({ length: n - 1 }, (_, i) => i + 1).map((k) => {
        const xm = r.x + r.h / 2 + seg * k, passou = r.x + fillW >= xm + 2;
        return <div key={k} style={{ position: "absolute", left: xm - 2, top: topo + 16, width: 4, height: r.h - 32, borderRadius: 2, background: passou ? "rgba(255,255,255,0.85)" : "rgba(120,100,80,0.26)", opacity: kt }} />;
      })}
      {f >= r.ta && <div style={{ position: "absolute", left: r.x + r.w - 3, top: topo - 140, width: 6, height: (r.h + 170) * eOut(cl((f - r.ta) / 6)), borderRadius: 3, background: cheio ? C.coral : C.tinta, boxShadow: cheio ? `0 0 ${4 + 18 * bate}px rgba(242,100,60,0.8)` : undefined }} />}
      {f >= r.ta && (
        <div style={{ position: "absolute", left: r.x + r.w - 300, width: 300, top: topo - 240, textAlign: "right", opacity: cl((f - r.ta) / 3) }}>
          <div style={{ ...st, position: "relative", fontWeight: 600, fontSize: 32, color: C.carvao }}>teto</div>
          <div style={{ ...st, position: "relative", fontWeight: 800, fontSize: 44, color: C.tinta, marginTop: 8, letterSpacing: "-0.02em" }}>R$ 81 mil</div>
        </div>
      )}
      {f >= r.f0 && <span style={{ ...st, left: r.x, top: topo + r.h + 28, fontWeight: 600, fontSize: 40, color: C.carvao, opacity: cl((f - r.f0) / 3) * (1 - ket) }}>R$ 1</span>}
      {ket > 0 && (
        <div style={{ position: "absolute", left: tagX, top: topo + r.h + 22, width: tagW, height: 64, borderRadius: 32, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", opacity: lerp(0.4, 1, ket), transform: `translate(${15 * (1 - ket)}px, ${15 * (1 - ket)}px)`, boxShadow: "0 10px 22px rgba(221,78,39,0.25)" }}>
          <span style={{ ...st, position: "relative", fontWeight: 800, fontSize: 34, color: "#FFFFFF", letterSpacing: "-0.01em" }}>R$ 6.750 por mês</span>
        </div>
      )}
      {f >= r.va && (
        <div style={{ ...st, left: 0, width: 1080, top: r.cb - ASC * r.cpx, textAlign: "center", fontWeight: 800, fontSize: r.cpx, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums", color: mixHex(C.coralClaro, C.coral, kv), opacity: lerp(0.4, 1, kv), transformOrigin: "50% 60%", transform: `translate(${15 * (1 - kv)}px, ${15 * (1 - kv)}px) scale(${1 + 0.06 * bate})` }}>{real(Math.max(1, 81000 * pn))}</div>
      )}
      {f >= r.ma && (
        <div style={{ position: "absolute", left: cx - R, top: cy - R, width: r.d, height: r.d, transform: `rotate(${roll}deg) scaleX(${Math.max(0.1, Math.abs(Math.cos((giro * Math.PI) / 180)))})`, filter: "drop-shadow(8px 14px 12px rgba(120,100,80,0.32))" }}>
          <Img src={staticFile(r.moeda)} style={{ width: r.d, height: r.d }} />
        </div>
      )}
    </>
  );
};
// a data em que o app chega (Pedro, 14/10: "dia 10 de novembro... bem bem explícito"): o bloco de calendário entra e
// arranca as folhas, uma por vez, até parar no 10 quando o "dez" é dito
const Calendario: React.FC<{ c: NonNullable<Batida["cal"]>; f: number; de: number }> = ({ c, f, de }) => {
  // as medidas vêm da largura do bloco (o desenho é de 440 de largura)
  const u = c.w / 440, k = eOut(cl((f - de) / 8)), cab = 118 * u, x0 = c.x - c.w / 2, y0 = c.y - c.h / 2;
  let i = 0;
  while (i < c.tr.length && f >= c.tr[i]) i++;
  const folha = (dia: number, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", left: 0, top: cab, width: c.w, height: c.h - cab, background: "#FFFFFF", borderRadius: "0 0 26px 26px", display: "flex", alignItems: "center", justifyContent: "center", ...extra }}>
      <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 290 * u, lineHeight: 1, letterSpacing: "-0.05em", color: C.tinta, marginTop: -10 * u }}>{dia}</span>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x0, top: y0, width: c.w, height: c.h, transform: `translateY(${Math.sin((f - de) / 9) * 7}px) scale(${lerp(0.7, 1, k)}) rotate(${lerp(-8, -2, k)}deg)`, opacity: k, filter: "drop-shadow(0 0 50px rgba(255,255,255,0.22))" }}>
      {[14, 7].map((o) => <div key={o} style={{ position: "absolute", left: (o * u) / 2, top: cab + o * u, width: c.w - o * u, height: c.h - cab, background: o === 14 ? "#C9C3BA" : "#E4DED5", borderRadius: "0 0 26px 26px" }} />)}
      {folha(c.dias[Math.min(i, c.dias.length - 1)])}
      {i > 0 && f - c.tr[i - 1] < 5 && folha(c.dias[i - 1], { transformOrigin: "50% 0%", transform: `translate(${-60 * cl((f - c.tr[i - 1]) / 5)}px, ${-120 * eOut(cl((f - c.tr[i - 1]) / 5))}px) rotate(${-24 * cl((f - c.tr[i - 1]) / 5)}deg)`, opacity: 1 - cl((f - c.tr[i - 1]) / 5) })}
      <div style={{ position: "absolute", left: 0, top: 0, width: c.w, height: cab, background: "linear-gradient(180deg, #FF8A5E, #F2643C 60%, #D9532D)", borderRadius: "26px 26px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 52 * u, letterSpacing: "0.08em", color: "#FFFFFF", lineHeight: 1 }}>{c.mes}</span>
      </div>
      {[0.28, 0.72].map((x) => <div key={x} style={{ position: "absolute", left: c.w * x - 13 * u, top: -26 * u, width: 26 * u, height: 58 * u, borderRadius: 13 * u, background: "linear-gradient(90deg, #3A3D46, #6A6E78, #3A3D46)" }} />)}
    </div>
  );
};
// a mão branca chega da quina de baixo à direita e aperta a pílula
const Mao: React.FC<{ m: NonNullable<Batida["mao"]>; f: number }> = ({ m, f }) => {
  if (f < m.a - 8) return null;
  const k = eOut(cl((f - (m.a - 8)) / 8)), tap = f >= m.a ? Math.sin(cl((f - m.a) / 5) * Math.PI) : 0;
  const px = lerp(m.ponta[0] + 380, m.ponta[0], k), py = lerp(m.ponta[1] + 640, m.ponta[1], k) + 10 * tap;
  return (
    <Img src={staticFile(m.src)} style={{ position: "absolute", left: px - m.pf[0] * m.tam, top: py - m.pf[1] * m.tam, width: m.tam, height: m.tam, transformOrigin: `${m.pf[0] * 100}% ${m.pf[1] * 100}%`, transform: `rotate(${lerp(16, 0, k)}deg) scale(${1 - 0.08 * tap})`, filter: "drop-shadow(14px 22px 18px rgba(80,64,48,0.3))" }} />
  );
};

const empurra = (f: number, de: number, ate: number) => {
  const kk = f - de;
  return kk < 2 ? lerp(0.02, 0.7, kk / 2) : lerp(0.7, 1, expo((kk - 2) / 30, Math.max(0.1, (ate - de - 2) / 30), 3));
};

const Conteudo: React.FC<{ b: Batida; f: number; fr: number }> = ({ b, f, fr }) => {
  const escuro = b.fundo === "preto";
  const flut = Math.sin((f - b.de) / 9) * 8;
  switch (b.tipo) {
    case "abre": {
      const t = (f - b.de) / 30, T = (b.ate - b.de) / 30;
      return (
        <>
          {b.voo && <Voo v={b.voo} f={f} />}
          <Recorte p={b.prop!} f={f} de={b.de} desfoque={2.5 * expo(t, T, b.cam.k)} />
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    }
    case "cabeca": {
      const h = b.cabeca!;
      return (
        <>
          <div style={{ position: "absolute", left: h.x - h.r - 70, top: h.y - h.r - 70, width: 2 * (h.r + 70), height: 2 * (h.r + 70), borderRadius: "50%", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 3px, transparent 3.6px)", backgroundSize: "16px 16px", maskImage: "radial-gradient(circle, transparent 66%, black 74%, black 84%, transparent 100%)" }} />
          <div style={{ position: "absolute", left: h.x - h.r, top: h.y - h.r, width: 2 * h.r, height: 2 * h.r, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 90px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.8)" }} />
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    }
    case "palavra":
    case "eco":
      return (
        <>
          {b.tipo === "eco" && [-90, 90].map((dx) => <div key={dx} style={{ position: "absolute", inset: 0, opacity: 0.12 }}><Linhas ls={b.linhas} f={f} escuro dx={dx} /></div>)}
          <Linhas ls={b.linhas} f={f} escuro={escuro} />
          <Linhas ls={b.conta} f={f} escuro={escuro} />
        </>
      );
    case "icone":
      return (
        <>
          {b.num ? <Num3D n={b.num} f={f} de={b.de} escuro={false} /> : <Recorte p={b.prop!} f={f} de={b.de} entra />}
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    case "rola": {
      // o objeto entra girado -70 graus, a 55%, gira pra nivelar e cresce (o giro do corte continua nele)
      const p = b.prop!, k = eOut(cl((f - b.de) / 20));
      return (
        <>
          <div style={{ position: "absolute", left: p.x - p.tam / 2, top: p.y - p.tam / 2, width: p.tam, height: p.tam, transform: `translateY(${flut * cl((f - b.de - 20) / 10)}px) rotate(${lerp(-70, 0, k)}deg) scale(${lerp(0.55, 1, k)})`, filter: "drop-shadow(0 0 40px rgba(255,255,255,0.14))" }}>
            <Img src={staticFile(p.src)} style={{ width: p.tam, height: p.tam }} />
          </div>
          <Linhas ls={b.linhas} f={f} escuro />
          <Linhas ls={b.embaixo} f={f} escuro />
        </>
      );
    }
    case "cartao": {
      // o cartão cinza fosco com a tachinha: aparece de um ponto até 70% em 2 quadros e vai crescendo até o fim
      const c = b.cartao!, s = empurra(f, b.de, b.ate);
      return (
        <div style={{ position: "absolute", left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, background: C.cartao, borderRadius: 8, boxShadow: "22px 30px 40px rgba(80,64,48,0.3)", transform: `scale(${s}) rotate(${Math.sin((f - b.de) / 25) * 1.2}deg)`, padding: "110px 56px 0", boxSizing: "border-box" }}>
          <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: c.tpx, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1, whiteSpace: "nowrap" }}>{c.titulo}</div>
          <div style={{ width: 0.68 * c.w, height: 13, background: C.divisor, margin: "34px 0 60px" }} />
          {c.rows.map((r, i) => {
            if (f < r.a) return null;
            const k = cl((f - r.a) / 3);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, opacity: lerp(0.4, 1, k), transform: `translate(${15 * (1 - k)}px, ${15 * (1 - k)}px)` }}>
                <Icone nome={r.icone} tam={72} />
                <span style={{ fontFamily: "Sora", fontWeight: 600, fontSize: r.px, color: "#F9F9F9", whiteSpace: "nowrap", lineHeight: 1 }}>{r.t}</span>
              </div>
            );
          })}
          <Tachinha x={c.w / 2} y={18} />
        </div>
      );
    }
    case "script": {
      // o "6%" no itálico da marca com o degradê coral: estoura de 25% a 115% e assenta em 100% em 6 quadros
      const s = b.script!;
      const k = cl((f - s.a) / 6), e = k < 0.6 ? lerp(0.25, 1.15, eOut(k / 0.6)) : lerp(1.15, 1, eInOut((k - 0.6) / 0.4));
      return (
        <>
          <Linhas ls={b.linhas} f={f} escuro={false} />
          {f >= s.a && (
            <div style={{ position: "absolute", left: s.x - 40, top: s.b - 0.8505 * s.px, width: s.w + 80, height: s.px * 1.1, transformOrigin: "50% 55%", transform: `scale(${e})`, textAlign: "center" }}>
              <span style={{ fontFamily: "DM Serif Display", fontStyle: "italic", fontSize: s.px, lineHeight: 1, whiteSpace: "nowrap", background: "linear-gradient(90deg, #FF9468 0%, #F2643C 48%, #C64521 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", padding: "0 40px" }}>{s.t}</span>
            </div>
          )}
        </>
      );
    }
    case "tela-pin": {
      const t = b.tela!, s = empurra(f, b.de, b.ate);
      return (
        <>
          <div style={{ position: "absolute", left: t.x - t.w / 2, top: t.y - t.h / 2, width: t.w, height: t.h, transform: `scale(${s}) rotate(${t.rot + Math.sin((f - b.de) / 25)}deg)` }}>
            <Tela src={t.src} w={t.w} h={t.h} />
            <Tachinha x={t.w / 2} y={14} />
          </div>
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    }
    case "celular": {
      // o iPhone 3D boiando no preto: entra desfocado a 75%, foca e cresce, com o brilho branco aumentando
      const c = b.cel!, k = eOut(cl((f - b.de) / 8)), i = Math.min(461, Math.max(0, c.i0 + (fr - b.de)));
      const gl = 18 + 42 * cl((f - b.de) / Math.max(1, b.ate - b.de));
      return (
        <>
          <Img src={staticFile(`cel17v7/cel_${String(i).padStart(4, "0")}.png`)} style={{ position: "absolute", left: c.x - c.w / 2, top: c.y - 0.75 * c.w, width: c.w, height: 1.5 * c.w, transform: `scale(${lerp(0.75, 1, k)}) translateY(${flut}px)`, filter: `blur(${(1 - k) * 14}px) drop-shadow(0 0 ${gl}px rgba(255,255,255,0.32))` }} />
          <Linhas ls={b.linhas} f={f} escuro />
          <Linhas ls={b.embaixo} f={f} escuro />
        </>
      );
    }
    case "cel3d": {
      // o iPhone 3D de verdade (Celular40Nota, 120 qps juntados em 30), quadro cheio, pelo quadro real
      const q = b.seq!, i = Math.min(q.n - 1, Math.max(0, fr - b.de));
      return (
        <>
          <Img src={staticFile(`${q.pasta}/cel_${String(i).padStart(4, "0")}.png`)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    }
    case "guia":
      return (
        <>
          <MesesGuia g={b.meses!} f={f} />
          <Linhas ls={b.linhas} f={f} escuro />
          <Linhas ls={b.embaixo} f={f} escuro />
        </>
      );
    case "barra":
      return (
        <>
          <BarraTeto r={b.barra!} f={f} fr={fr} />
          <Linhas ls={b.linhas} f={f} escuro={false} />
          <Linhas ls={b.embaixo} f={f} escuro={false} />
        </>
      );
    case "data":
      return (
        <>
          <Calendario c={b.cal!} f={f} de={b.de} />
          <Linhas ls={b.linhas} f={f} escuro />
          <Linhas ls={b.embaixo} f={f} escuro />
        </>
      );
    case "moeda":
      return (
        <>
          <Moeda3D m={b.moeda!} f={f} />
          <Linhas ls={b.linhas} f={f} escuro={false} />
        </>
      );
    case "cofrinho": {
      const topo = Math.max(...b.linhas.map((l) => l.b + 0.22 * Math.max(...l.pal.map((p) => p.px))));
      return (
        <>
          <Cofrinho c={b.cofrinho!} f={f} de={b.de} topo={topo} />
          <Linhas ls={b.linhas} f={f} escuro />
        </>
      );
    }
    case "pilula": {
      const p = b.pilula!;
      return (
        <>
          <Linhas ls={b.linhas} f={f} escuro={false} />
          {f >= p.a && (
            <div style={{ position: "absolute", left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h, borderRadius: p.h / 2, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "18px 26px 30px rgba(184,61,28,0.3)", transform: `scale(${pop(f, p.a) * (b.mao && f >= b.mao.a ? 1 - 0.05 * Math.sin(cl((f - b.mao.a) / 5) * Math.PI) : 1)}) rotate(${-4 * (1 - eOut(cl((f - p.a) / 7)))}deg)` }}>
              <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 92, letterSpacing: "0.03em", color: "#FFFFFF", lineHeight: 1, whiteSpace: "nowrap" }}>LINK DA BIO</span>
            </div>
          )}
          {b.mao && <Mao m={b.mao} f={f} />}
        </>
      );
    }
    case "numero":
      return (
        <>
          <Num3D n={b.num!} f={f} de={b.de} escuro />
          <Linhas ls={b.linhas} f={f} escuro />
        </>
      );
    case "fecho": {
      // o fecho do kit: "Vai," + o logo, o "aí" acende quando é dito e a pílula LINK DA BIO entra embaixo
      const W = 198, X0 = 540 - (W + 28 + 590) / 2, ai = cl((f - ((b.ai ?? b.de + 28) - 2)) / 4), tp = b.tp ?? b.de + 38;
      return (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "540px 920px", transform: `scale(${pop(f, b.de, 9)})` }}>
            <div style={{ position: "absolute", left: X0, top: 926, transform: "translateY(-50%)", fontFamily: "Sora", fontWeight: 800, fontSize: 106, letterSpacing: "-0.035em", lineHeight: 1, color: C.tinta, whiteSpace: "nowrap" }}>Vai,</div>
            <Img src={staticFile("marca/logo-ai-tinta.svg")} style={{ position: "absolute", left: X0 + W + 28, top: 920 - 58, width: 590 }} />
            <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: X0 + W + 28, top: 920 - 58, width: 590, opacity: ai }} />
          </div>
          {f >= tp && (
            <div style={{ position: "absolute", left: 540 - 165, top: 1060, width: 330, height: 70, borderRadius: 35, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop(f, tp, 8)})`, boxShadow: "0 12px 26px rgba(221,78,39,0.28)" }}>
              <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 34, letterSpacing: "0.06em", color: "#FFFFFF", lineHeight: 1 }}>LINK DA BIO</span>
            </div>
          )}
          {b.dataFim && f >= b.dataFim.a && (
            <div style={{ position: "absolute", left: 0, width: 1080, top: 1166, textAlign: "center", fontFamily: "Sora", fontWeight: 600, fontSize: 54, lineHeight: 1, letterSpacing: "-0.01em", color: C.tinta, whiteSpace: "nowrap", opacity: lerp(0.4, 1, cl((f - b.dataFim.a) / 3)), transform: `translate(${15 * (1 - cl((f - b.dataFim.a) / 3))}px, ${15 * (1 - cl((f - b.dataFim.a) / 3))}px)` }}>
              {b.dataFim.t.replace(/\s*\S+$/, " ")}<span style={{ fontWeight: 800, color: C.coral }}>{b.dataFim.t.split(" ").slice(-1)[0]}</span>
            </div>
          )}
        </>
      );
    }
  }
  return null;
};

// ---------- câmera: cada batida empurra; o giro de 0 a 15 graus e o chicote até 25 antes do corte ----------
const camera = (b: Batida, f: number, fr: number): React.CSSProperties => {
  const t = Math.max(0, (f - b.de) / 30), T = (b.ate - b.de) / 30;
  let s = 1 + (b.cam.s1 - 1) * expo(t, T, b.cam.k), rot = 0;
  if (b.saida === "giro") {
    const r = b.ate - f;
    rot = 15 * eOut(cl(t / Math.max(0.1, T - 0.17))) + (r <= 5 ? 10 * eInOut(cl((5 - r) / 5)) : 0);
  }
  if (b.saida === "flicker" && b.ate - fr === 1) s *= 1.06;
  return { transformOrigin: `${b.cam.px}px ${b.cam.py}px`, transform: `scale(${s}) rotate(${rot}deg)` };
};

// ---------- passagens (camada da frente, sem blur) ----------
const Passagem: React.FC<{ b: Batida; fr: number }> = ({ b, fr }) => {
  const r = b.ate - fr, el: React.ReactNode[] = [];
  if (b.saida === "branco" || b.saida === "giro") {
    const k = cl((5 - r) / 4);
    if (k > 0) el.push(<AbsoluteFill key="s" style={{ background: "#FFFFFF", opacity: eOut(k) }} />);
  } else if (b.saida === "iris") {
    const k = cl((8 - r) / 7), o = b.iris ?? [540, 960];
    if (k > 0) { const raio = 2400 * eInOut(k); el.push(<AbsoluteFill key="s" style={{ background: `radial-gradient(circle at ${o[0]}px ${o[1]}px, ${C.preto} ${Math.max(0, raio - 70)}px, rgba(14,15,18,0) ${raio + 70}px)` }} />); }
  } else if (b.saida === "bloom") {
    const k = cl((6 - r) / 5);
    if (k > 0) { const raio = 2300 * eOut(k); el.push(<AbsoluteFill key="s" style={{ background: `radial-gradient(circle at 540px 940px, #FFFFFF ${Math.max(0, raio - 240)}px, rgba(255,255,255,0) ${raio + 90}px)` }} />); }
  } else if (b.saida === "flicker") {
    if (r === 4 || r === 2) el.push(<AbsoluteFill key="s" style={{ background: "#000000", opacity: 0.45 }} />);
    if (r === 3) el.push(<AbsoluteFill key="s" style={{ background: "#000000" }} />);
    if (r === 1) el.push(<AbsoluteFill key="s" style={{ background: "#FFFFFF", opacity: 0.35 }} />);
  } else if (b.saida === "preto" && r === 1) {
    el.push(<AbsoluteFill key="s" style={{ background: "#000000" }} />);
  }
  if (b.entrada === "branco") {
    const k = cl((fr - b.de) / 4);
    if (k < 1) el.push(<AbsoluteFill key="e" style={{ background: "#FFFFFF", opacity: Math.pow(1 - k, 1.5) }} />);
  }
  return <>{el}</>;
};

const Movel: React.FC<{ fr: number }> = ({ fr }) => {
  const b = achar(fr);
  const f = Math.max(useCurrentFrame(), b.de);
  return (
    <AbsoluteFill style={camera(b, f, fr)}>
      <Conteudo b={b} f={f} fr={fr} />
    </AbsoluteFill>
  );
};

export const Cinco40Prompt: React.FC = () => {
  pedeFontes();
  const fr = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  const b = achar(fr);
  return (
    <AbsoluteFill style={{ backgroundColor: b.fundo === "preto" ? C.preto : C.papel, overflow: "hidden" }}>
      <AbsoluteFill style={camera(b, fr, fr)}>
        <Fundo b={b} f={fr} />
      </AbsoluteFill>
      {isRendering ? (
        <HtmlInCanvasMotionBlur width={1080} height={1920} samples={8} shutterAngle={200}>
          <Movel fr={fr} />
        </HtmlInCanvasMotionBlur>
      ) : (
        <Movel fr={fr} />
      )}
      <Passagem b={b} fr={fr} />
    </AbsoluteFill>
  );
};
