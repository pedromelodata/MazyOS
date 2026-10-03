import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { C, FONT, clamp01, lerp, outBack, outCubic } from "../lib/tl";

// tema escuro e escala coral do design guide
export const DK = { card: "#1F2228", alt: "#282B32", text: "#F4F1EC", text2: "#BDB8B0", hair: "#2E313A" };
export const CO = { c100: "#FBDDD1", c200: "#F8C3B0", c300: "#F5A184", c400: "#F47F58", c800: "#8C2F16" };
export const SH = "0 18px 40px rgba(27,30,36,0.14), 0 4px 10px rgba(27,30,36,0.08)";
export const SHD = "0 26px 60px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.3)";

export const At: React.FC<{
  x: number; y: number; sc?: number; al?: number; rot?: number; blur?: number; origin?: string; children: React.ReactNode;
}> = ({ x, y, sc = 1, al = 1, rot = 0, blur = 0, origin = "50% 50%", children }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, translate: "-50% -50%", scale: `${sc}`, opacity: al, rotate: `${rot}deg`,
      transformOrigin: origin, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
    }}
  >
    {children}
  </div>
);

/** mola amortecida que parte de 0 (soco de escala / giro) */
export const spring = (t: number, t0: number, amp = 0.1, f = 2.6, damp = 6.5) => {
  const d = t - t0;
  if (d < 0) return 0;
  return amp * Math.exp(-damp * d) * Math.sin(2 * Math.PI * f * d);
};

/** tremida amortecida (pixels) */
export const shake = (t: number, t0: number, amp = 14, seed = 0) => {
  const d = t - t0;
  if (d < 0 || d > 0.6) return 0;
  return amp * Math.exp(-9 * d) * 0.5 * (Math.sin(83 * d + seed) + Math.sin(127 * d + 2 * seed));
};

/** entrada com mola: 0 antes de t0; escala sai de s0 */
export const inn = (t: number, t0: number, dur = 0.34, s0 = 0.4, over = 1.8) => {
  const p = (t - t0) / dur;
  if (p <= 0) return { sc: s0, al: 0, k: 0 };
  return { sc: lerp(s0, 1, outBack(p, over)), al: clamp01(p / 0.3), k: clamp01(p) };
};

// ---------- fundos
export type BgKind = "paper" | "dark" | "coral";
export const Bg: React.FC<{ kind: BgKind; t: number }> = ({ kind, t }) => {
  const dot = kind === "paper" ? "rgba(203,197,188,0.55)" : kind === "dark" ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.13)";
  const base = kind === "paper" ? C.bg : kind === "coral" ? C.coral6 : "linear-gradient(160deg,#2A2E37 0%,#15171C 62%,#202433 100%)";
  return (
    <AbsoluteFill style={{ background: base }}>
      {kind === "dark" && <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 15% 0%, rgba(242,100,60,.22), transparent 60%)" }} />}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${dot} 2.3px, transparent 2.9px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: `${((t * 10) % 44).toFixed(2)}px ${((t * 6) % 44).toFixed(2)}px`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- numeral gigante
export const Numeral: React.FC<{ n: number; size?: number; color?: string; outline?: boolean }> = ({ n, size = 1000, color = C.coral, outline }) => (
  <div
    style={{
      fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 0.78, letterSpacing: "-0.06em",
      color: outline ? "transparent" : color, WebkitTextStroke: outline ? `7px ${color}` : undefined,
    }}
  >
    {n}
  </div>
);

// ---------- adesivo: ícone clay dentro de um disco branco
export const Sticker: React.FC<{ icon: string; d: number; pad?: number; ring?: string }> = ({ icon, d, pad = 0.1, ring }) => (
  <div
    style={{
      width: d, height: d, borderRadius: "50%", background: C.white, boxShadow: SH, display: "flex", alignItems: "center",
      justifyContent: "center", border: ring ? `6px solid ${ring}` : undefined, boxSizing: "border-box",
    }}
  >
    <Img src={staticFile(`icons/${icon}.webp`)} style={{ width: d * (1 - 2 * pad), height: d * (1 - 2 * pad) }} />
  </div>
);

// ---------- sequência clay (24 fps) num cartão
export const ClayCard: React.FC<{ seq: "cadastro" | "calculo"; frame: number; size: number }> = ({ seq, frame, size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.1, overflow: "hidden", border: "12px solid #fff", boxShadow: SH, background: "#F3ECE3" }}>
    <Img
      src={staticFile(`clay/${seq}/${String(Math.max(0, Math.min(120, Math.floor(frame)))).padStart(3, "0")}.jpg`)}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  </div>
);

// ---------- balão de conversa
export const Bubble: React.FC<{ text: string; side?: "l" | "r"; w?: number }> = ({ text, side = "l", w = 440 }) => (
  <div style={{ position: "relative" }}>
    <div
      style={{
        background: C.white, borderRadius: 34, padding: "22px 30px 21px", maxWidth: w, boxShadow: SH, border: `2px solid ${C.hair}`,
        fontFamily: FONT, fontWeight: 600, fontSize: 38, lineHeight: 1.22, color: C.ink, letterSpacing: "-0.01em",
      }}
    >
      {text}
    </div>
    <svg width={36} height={32} style={{ position: "absolute", bottom: -9, left: side === "l" ? -10 : undefined, right: side === "r" ? -10 : undefined, scale: side === "r" ? "-1 1" : undefined }}>
      <path d="M24 0 L2 30 L36 13 Z" fill={C.white} />
    </svg>
  </div>
);

// ---------- agenda (células acendem em diagonal)
const ORD = (() => {
  const cells: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) cells.push([r, c]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[0] - b[0]);
  const m: number[] = new Array(35);
  cells.forEach(([r, c], k) => (m[r * 7 + c] = k));
  return m;
})();
export const Calendar: React.FC<{ month: string; t: number; t0: number; dur: number }> = ({ month, t, t0, dur }) => (
  <div style={{ width: 540, background: C.white, borderRadius: 40, overflow: "hidden", boxShadow: SH, border: `2px solid ${C.hair}` }}>
    <div style={{ height: 104, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, color: C.white, letterSpacing: "0.04em" }}>{month}</span>
      {[150, 390].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 10, top: -14, width: 20, height: 40, borderRadius: 10, background: C.coral7 }} />
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 56px)", gap: 11, justifyContent: "center", padding: "18px 0 30px" }}>
      {"DSTQQSS".split("").map((L, i) => (
        <div key={i} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: C.ink2, textAlign: "center" }}>{L}</div>
      ))}
      {Array.from({ length: 35 }).map((_, k) => {
        const p = clamp01((t - (t0 + (ORD[k] / 35) * dur)) / 0.14);
        return (
          <div key={k} style={{ width: 56, height: 56, borderRadius: 14, background: C.alt, position: "relative" }}>
            {p > 0 && <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: C.coral, scale: `${lerp(0.3, 1, outBack(p, 2.2))}` }} />}
          </div>
        );
      })}
    </div>
  </div>
);

// ---------- carimbo
export const Stamp: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      border: `9px solid ${C.coral7}`, borderRadius: 22, padding: "4px 30px 8px", fontFamily: FONT, fontWeight: 800, fontSize: 92,
      color: C.coral7, letterSpacing: "0.06em", background: "rgba(250,248,245,0.82)", whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

// ---------- etiqueta de preço pendurada (furo em cima)
export const HangTag: React.FC<{ hole?: string }> = ({ hole = "#1A1D23" }) => (
  <svg width={270} height={370} viewBox="0 0 270 370" style={{ filter: "drop-shadow(0 22px 30px rgba(0,0,0,0.45))" }}>
    <path d="M135 0 L270 96 V338 a32 32 0 0 1 -32 32 H32 a32 32 0 0 1 -32 -32 V96 Z" fill={C.coral} />
    <circle cx={135} cy={82} r={19} fill={hole} />
    <text x={135} y={262} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={112} fill="#fff">R$</text>
  </svg>
);

// ---------- cadeado (fecha: shut 0 -> 1)
export const Padlock: React.FC<{ shut: number }> = ({ shut }) => (
  <svg width={150} height={190} viewBox="0 0 150 190" style={{ filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.45))" }}>
    <path d={`M38 ${92 - 26 * (1 - shut)} V58 a37 37 0 0 1 74 0 V${92 - 26 * (1 - shut)}`} stroke={DK.text2} strokeWidth={17} fill="none" strokeLinecap="round" />
    <rect x={10} y={80} width={130} height={106} rx={24} fill={DK.text} />
    <circle cx={75} cy={124} r={13} fill={C.ink} />
    <rect x={69} y={128} width={12} height={30} rx={5} fill={C.ink} />
  </svg>
);

// ---------- odômetro do ano: "202" fixo + último dígito rolando
export const YearOdo: React.FC<{ digit: number }> = ({ digit }) => {
  const H = 150;
  return (
    <div style={{ display: "flex", alignItems: "center", background: DK.card, border: `2px solid ${DK.hair}`, borderRadius: 34, padding: "0 40px", height: H + 20, boxShadow: SHD }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 132, color: DK.text, letterSpacing: "-0.03em", lineHeight: `${H}px` }}>202</span>
      <div style={{ height: H, overflow: "hidden", position: "relative", width: 86 }}>
        <div style={{ position: "absolute", left: 0, top: -(digit - 4) * H }}>
          {[4, 5, 6].map((d) => (
            <div key={d} style={{ height: H, fontFamily: FONT, fontWeight: 800, fontSize: 132, color: C.coral, lineHeight: `${H}px`, letterSpacing: "-0.03em" }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- checklist dos 3 sinais
export const ROT = ["ninguém reclama", "agenda cheia", "preço parado"];
export const Check: React.FC<{ on: number; size?: number; dark?: boolean }> = ({ on, size = 86 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, border: `5px solid ${on > 0 ? C.coral : C.hair}`, background: on > 0 ? C.coral : C.white, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 70 70">
      <path d="M14 37 L29 51 L56 20" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(on)} />
    </svg>
  </div>
);

export const NumDot: React.FC<{ n: number; size?: number; filled?: boolean }> = ({ n, size = 84, filled }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: filled ? C.coral : C.white, border: filled ? "none" : `5px solid ${C.coral}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SH }}>
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.5, color: filled ? C.white : C.coral6 }}>{n}</span>
  </div>
);

// ---------- despertador (ring: tremida de toque)
export const AlarmClock: React.FC<{ spin: number; ring: number }> = ({ spin, ring }) => (
  <svg width={440} height={470} viewBox="0 0 440 470" style={{ overflow: "visible", filter: "drop-shadow(0 18px 28px rgba(27,30,36,0.18))" }}>
    <g transform={`rotate(${(ring * 7).toFixed(2)} 220 250)`}>
      <path d="M70 120 a70 70 0 0 1 96 -54 Z" fill={C.coral} transform="rotate(-8 110 90)" />
      <path d="M370 120 a70 70 0 0 0 -96 -54 Z" fill={C.coral} transform="rotate(8 330 90)" />
      <rect x={206} y={52} width={28} height={40} rx={8} fill={C.ink} />
      <line x1={120} y1={420} x2={92} y2={462} stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
      <line x1={320} y1={420} x2={348} y2={462} stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
      <circle cx={220} cy={262} r={176} fill={C.white} stroke={C.ink} strokeWidth={18} />
      {Array.from({ length: 12 }).map((_, k) => {
        const a = (k * Math.PI) / 6;
        const r1 = k % 3 === 0 ? 124 : 138;
        return <line key={k} x1={220 + Math.sin(a) * r1} y1={262 - Math.cos(a) * r1} x2={220 + Math.sin(a) * 150} y2={262 - Math.cos(a) * 150} stroke={k % 3 === 0 ? C.ink : "#CBC5BC"} strokeWidth={k % 3 === 0 ? 10 : 7} strokeLinecap="round" />;
      })}
      <line x1={220} y1={262} x2={220 + Math.sin(spin * Math.PI * 2 / 12) * 78} y2={262 - Math.cos(spin * Math.PI * 2 / 12) * 78} stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
      <line x1={220} y1={262} x2={220 + Math.sin(spin * Math.PI * 2) * 118} y2={262 - Math.cos(spin * Math.PI * 2) * 118} stroke={C.coral6} strokeWidth={11} strokeLinecap="round" />
      <circle cx={220} cy={262} r={15} fill={C.ink} />
    </g>
    {ring > 0.05 &&
      [-1, 1].map((s) => (
        <g key={s} opacity={clamp01(ring)} stroke={C.coral6} strokeWidth={10} strokeLinecap="round">
          <line x1={220 + s * 205} y1={70} x2={220 + s * 240} y2={40} />
          <line x1={220 + s * 222} y1={130} x2={220 + s * 268} y2={122} />
          <line x1={220 + s * 190} y1={20} x2={220 + s * 208} y2={-14} />
        </g>
      ))}
  </svg>
);

// ---------- seta grande de reajuste
export const BigArrow: React.FC<{ w?: number }> = ({ w = 560 }) => (
  <svg width={w} height={(w * 900) / 620} viewBox="0 0 620 900">
    <path d="M310 0 L610 330 L425 330 L425 900 L195 900 L195 330 L10 330 Z" fill={C.coral} />
  </svg>
);

// ---------- raios girando
export const Rays: React.FC<{ n?: number; len?: number; color?: string; a1?: number; a2?: number }> = ({ n = 18, len = 1500, color = "255,255,255", a1 = 0.1, a2 = 0.18 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => (
      <div
        key={i}
        style={{
          position: "absolute", left: -45, top: -len, width: 90, height: len, transformOrigin: "50% 100%", rotate: `${(i * 360) / n}deg`,
          background: `linear-gradient(to top, rgba(${color},0), rgba(${color},${i % 2 ? a1 : a2}))`,
          clipPath: "polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)",
        }}
      />
    ))}
  </>
);

// ---------- confete
export const Confetti: React.FC<{ t: number; t0: number; x: number; y: number; cols: string[]; n?: number; power?: number }> = ({ t, t0, x, y, cols, n = 56, power = 1 }) => {
  const d = t - t0;
  if (d < 0 || d > 1.6) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const ang = -Math.PI / 2 + (random(`a${i}`) - 0.5) * Math.PI * 1.5;
        const v = (950 + random(`v${i}`) * 1100) * power;
        const px = x + Math.cos(ang) * v * d;
        const py = y + Math.sin(ang) * v * d + 1700 * d * d;
        const sz = 14 + random(`s${i}`) * 18;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: px, top: py, width: sz, height: sz * (random(`r${i}`) > 0.5 ? 0.45 : 1),
              borderRadius: random(`c${i}`) > 0.6 ? "50%" : 4, background: cols[i % cols.length],
              rotate: `${(d * 800 * (random(`w${i}`) - 0.5)).toFixed(1)}deg`, opacity: clamp01((1.6 - d) / 0.4),
            }}
          />
        );
      })}
    </>
  );
};

// ---------- celular com a tela de abertura do app
export const Phone: React.FC<{ w?: number }> = ({ w = 300 }) => {
  const h = w * 2.08;
  return (
    <div style={{ width: w, height: h, background: "#0E1014", borderRadius: w * 0.17, padding: w * 0.036, boxSizing: "border-box", boxShadow: SHD, position: "relative", border: "3px solid #3A3D44" }}>
      <Img src={staticFile("splash.png")} style={{ width: "100%", height: "100%", borderRadius: w * 0.14, objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", left: w / 2 - w * 0.14, top: w * 0.075, width: w * 0.28, height: w * 0.085, borderRadius: w * 0.05, background: "#0E1014" }} />
    </div>
  );
};

// ---------- olho (open 0..1)
export const Eye: React.FC<{ open: number; w?: number; look?: number }> = ({ open, w = 240, look = 0 }) => {
  const hh = 48 * Math.max(0.06, open);
  return (
    <svg width={w} height={(w * 110) / 170} viewBox="0 0 170 110" style={{ overflow: "visible" }}>
      <path d={`M8 55 Q85 ${55 - hh * 2} 162 55 Q85 ${55 + hh * 2} 8 55 Z`} fill="#fff" stroke={C.coral} strokeWidth={7} strokeLinejoin="round" />
      {open > 0.3 && (
        <g clipPath="url(#olho)">
          <circle cx={85 + look * 14} cy={55} r={27 * Math.min(1, open)} fill={C.coral} />
          <circle cx={85 + look * 14} cy={55} r={12 * Math.min(1, open)} fill={C.ink} />
          <circle cx={93 + look * 14} cy={46} r={5 * Math.min(1, open)} fill="#fff" />
        </g>
      )}
      <defs>
        <clipPath id="olho">
          <path d={`M8 55 Q85 ${55 - hh * 2} 162 55 Q85 ${55 + hh * 2} 8 55 Z`} />
        </clipPath>
      </defs>
    </svg>
  );
};

// ---------- medidor do teto do MEI (escuro)
export const TetoCard: React.FC<{ fill: number; val: number }> = ({ fill, val }) => (
  <div style={{ width: 440, background: DK.card, borderRadius: 34, padding: "28px 32px 26px", boxSizing: "border-box", border: `2px solid ${DK.hair}`, boxShadow: SHD, position: "relative" }}>
    <Img src={staticFile("icons/metricas.webp")} style={{ position: "absolute", right: 18, top: -44, width: 118, height: 118, rotate: "10deg" }} />
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 25, color: DK.text2, letterSpacing: "0.14em" }}>TETO DO MEI</div>
    <div style={{ marginTop: 18, height: 30, borderRadius: 15, background: DK.alt, position: "relative" }}>
      <div style={{ width: `${(78 * outCubic(fill)).toFixed(2)}%`, height: "100%", borderRadius: 15, background: C.coral }} />
      <div style={{ position: "absolute", right: 6, top: -10, width: 8, height: 50, borderRadius: 4, background: DK.text }} />
    </div>
    <div style={{ marginTop: 20, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: DK.text, letterSpacing: "-0.02em", opacity: val, translate: `0px ${((1 - outCubic(val)) * 12).toFixed(1)}px` }}>
      R$ <span style={{ color: C.coral }}>81 mil</span> por ano
    </div>
  </div>
);

// ---------- balão de comentário com "digitando"
export const CommentIcon: React.FC<{ t: number; w?: number }> = ({ t, w = 330 }) => (
  <svg width={w} height={(w * 260) / 300} viewBox="0 0 300 260" style={{ overflow: "visible", filter: "drop-shadow(0 18px 26px rgba(184,61,28,0.28))" }}>
    <path d="M60 10 H240 a50 50 0 0 1 50 50 V150 a50 50 0 0 1 -50 50 H130 L70 250 L84 200 H60 a50 50 0 0 1 -50 -50 V60 a50 50 0 0 1 50 -50 Z" fill={C.coral} />
    {[0, 1, 2].map((k) => {
      const b = Math.max(0, Math.sin((t * 2 * Math.PI) / 0.9 - k * 0.9));
      return <circle key={k} cx={100 + k * 50} cy={105 - b * 14} r={17} fill="#fff" />;
    })}
  </svg>
);

export const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; border?: string }> = ({ children, bg = C.white, color = C.ink, size = 30, border }) => (
  <div style={{ background: bg, borderRadius: 999, padding: `${size * 0.3}px ${size * 0.8}px`, fontFamily: FONT, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", letterSpacing: "-0.01em", boxShadow: SH, border }}>
    {children}
  </div>
);

// ---------- brilho de 4 pontas
export const Sparkle: React.FC<{ s: number; color?: string }> = ({ s, color = "#fff" }) => (
  <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ scale: `${s}` }}>
    <path d="M0 -28 C4 -6 6 -4 28 0 C6 4 4 6 0 28 C-4 6 -6 4 -28 0 C-6 -4 -4 -6 0 -28 Z" fill={color} />
  </svg>
);
