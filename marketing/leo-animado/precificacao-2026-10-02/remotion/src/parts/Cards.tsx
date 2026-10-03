import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, FPS, T, clamp01, leave, lerp, outBack, outCubic, pop } from "../lib/tl";
import { layoutAt } from "./LeoLayer";

const shadow = "0 14px 30px rgba(27,30,36,0.13), 0 3px 8px rgba(27,30,36,0.08)";

const At: React.FC<{ x: number; y: number; sc?: number; al?: number; rot?: number; children: React.ReactNode }> = ({
  x, y, sc = 1, al = 1, rot = 0, children,
}) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", scale: `${sc}`, opacity: al, rotate: `${rot}deg` }}>
    {children}
  </div>
);

// ---------- sinal 1: clientes aceitando o preço
const Bubble: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "relative" }}>
    <div
      style={{
        background: C.white, borderRadius: 30, padding: "20px 30px", maxWidth: 360, boxShadow: shadow,
        fontFamily: FONT, fontWeight: 600, fontSize: 38, lineHeight: 1.22, color: C.ink, letterSpacing: "-0.01em",
      }}
    >
      {text}
    </div>
    <svg width={34} height={30} style={{ position: "absolute", left: -12, bottom: -8 }}>
      <path d="M22 0 L2 28 L34 12 Z" fill={C.white} />
    </svg>
  </div>
);

const S1: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T(10), t1 = T(17) - 0.34;
  if (t < t0 || t > t1 + 0.35) return null;
  const fo = leave(t, t1, 0.26);
  const dx = -(1 - fo) * 140;
  const items: [string, number, number][] = [
    ["Fechado, pode marcar!", 11, 930],
    ["Perfeito, combinado.", 12, 1085],
    ["Tem horário na semana que vem?", 13, 1265],
  ];
  return (
    <>
      {items.map(([txt, wi, y]) => {
        const p = pop(t, T(wi) - 0.02, 0.3, 0.5, 1.8);
        if (p.al <= 0) return null;
        return (
          <div key={wi} style={{ position: "absolute", left: 56 + dx, top: y + p.dy - 50, scale: `${p.sc}`, opacity: p.al * fo, transformOrigin: "0% 100%" }}>
            <Bubble text={txt} />
          </div>
        );
      })}
    </>
  );
};

// ---------- sinal 2: agenda cheia
const order = (() => {
  const cells: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) cells.push([r, c]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const m = new Map<string, number>();
  cells.forEach(([r, c], k) => m.set(`${r}-${c}`, k));
  return m;
})();

const Calendar: React.FC<{ month: string; on: number }> = ({ month, on }) => (
  <div style={{ width: 340, height: 372, background: C.white, borderRadius: 34, overflow: "hidden", boxShadow: shadow }}>
    <div style={{ height: 84, background: C.coral, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12 }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: C.white, letterSpacing: "0.02em" }}>{month}</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 34px)", gap: 9, justifyContent: "center", marginTop: 14 }}>
      {"DSTQQSS".split("").map((L, i) => (
        <div key={i} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 19, color: C.ink2, textAlign: "center" }}>{L}</div>
      ))}
      {Array.from({ length: 35 }).map((_, k) => {
        const r = Math.floor(k / 7), c = k % 7;
        const o = order.get(`${r}-${c}`)! < on;
        return <div key={k} style={{ width: 34, height: 34, borderRadius: 10, background: o ? C.coral : C.alt }} />;
      })}
    </div>
  </div>
);

const S2: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T(17), t1 = T(25) - 0.34;
  if (t < t0 || t > t1 + 0.35) return null;
  const fo = leave(t, t1, 0.26);
  const dx = (1 - fo) * 160;
  const nOn = Math.floor(35 * clamp01((t - (T(21) - 0.05)) / 0.5));
  const months: [string, number, number][] = [["OUT", T(19) - 0.1, nOn], ["NOV", T(22) - 0.04, 35], ["DEZ", T(24) - 0.04, 35]];
  const shown = months.filter((m) => t >= m[1]);
  const depth = shown.length - 1;
  return (
    <>
      {shown.map(([m, ts, on], k) => {
        const lvl = depth - k;
        const p = pop(t, ts, 0.32, 0.6, 1.6);
        return (
          <At key={m} x={790 + dx + lvl * 14} y={1080 - lvl * 74 + p.dy * 2} sc={p.sc * (1 - 0.06 * lvl)} al={p.al * fo * (1 - 0.1 * lvl)}>
            <Calendar month={m} on={on} />
          </At>
        );
      })}
    </>
  );
};

// ---------- sinal 3: mesmo preço há dois anos
const Tag: React.FC = () => (
  <svg width={330} height={190} viewBox="0 0 330 190" style={{ filter: "drop-shadow(0 12px 18px rgba(27,30,36,0.16))" }}>
    <path d="M70 0 H300 a30 30 0 0 1 30 30 V160 a30 30 0 0 1 -30 30 H70 L8 121 V69 Z" fill={C.coral} />
    <circle cx={62} cy={95} r={14} fill={C.bg} />
    <text x={200} y={128} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} fill="#fff">R$</text>
  </svg>
);

const Year: React.FC<{ y: number }> = ({ y }) => (
  <div style={{ width: 300, height: 120, background: C.white, borderRadius: 28, boxShadow: shadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, color: C.ink, letterSpacing: "-0.02em" }}>{y}</span>
  </div>
);

const S3: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T(25), t1 = T(35) - 0.34;
  if (t < t0 || t > t1 + 0.35) return null;
  const fo = leave(t, t1, 0.26);
  const dx = -(1 - fo) * 140;
  const tt = T(27) - 0.06;
  const tag = pop(t, tt, 0.3, 0.7, 1.4);
  const d = Math.max(0, t - tt);
  const ang = 16 * Math.exp(-3.2 * d) * Math.cos(9.5 * d) - 6;
  const yrs: [number, number][] = [[2024, T(32) - 0.04], [2025, T(33) - 0.04], [2026, T(34) - 0.04]];
  const cur = yrs.filter(([, ts]) => t >= ts);
  let yearEl = null;
  if (cur.length) {
    const [y, ts] = cur[cur.length - 1];
    const prev = cur.length > 1 ? cur[cur.length - 2][0] : null;
    const p = clamp01((t - ts) / 0.16);
    const first = pop(t, yrs[0][1], 0.28, 0.6, 1.6);
    yearEl = prev && p < 1 ? (
      <>
        <At x={240 + dx} y={1215 - 18 * p} al={(1 - p) * fo}><Year y={prev} /></At>
        <At x={240 + dx} y={1215 + 30 * (1 - p)} al={p * fo}><Year y={y} /></At>
      </>
    ) : (
      <At x={240 + dx} y={1215} sc={prev ? 1 : first.sc} al={(prev ? 1 : first.al) * fo}><Year y={y} /></At>
    );
  }
  return (
    <>
      {tag.al > 0 && <At x={262 + dx} y={985 + tag.dy} sc={tag.sc} al={tag.al * fo} rot={ang}><Tag /></At>}
      {yearEl}
    </>
  );
};

// ---------- bateu dois? (bolinhas) e CTA
const Chip: React.FC<{ n: number; on: boolean }> = ({ n, on }) => (
  <div
    style={{
      width: 118, height: 118, borderRadius: "50%", boxShadow: shadow,
      background: on ? C.coral : C.white, border: on ? "none" : `5px solid ${C.coral}`, boxSizing: "border-box",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    {on ? (
      <svg width={70} height={70} viewBox="0 0 70 70"><path d="M16 36 L29 49 L54 22" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ) : (
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: C.coral6 }}>{n}</span>
    )}
  </div>
);

const S4: React.FC<{ t: number }> = ({ t }) => {
  if (t < T(35) - 0.05 || t > T(37) + 0.1) return null;
  const fo = leave(t, T(37) - 0.16, 0.14);
  return (
    <>
      {[1, 2, 3].map((n, k) => {
        let p = pop(t, T(35) + 0.05 * k, 0.28, 0.4, 2.0);
        const on = n <= 2 && t >= T(36) + 0.1 * (n - 1);
        if (on) p = { ...p, sc: pop(t, T(36) + 0.1 * (n - 1), 0.24, 0.8, 3.0).sc };
        if (p.al <= 0) return null;
        return <At key={n} x={540 + (k - 1) * 150} y={610 + p.dy} sc={p.sc} al={p.al * fo}><Chip n={n} on={on} /></At>;
      })}
    </>
  );
};

const ROT = ["ninguém reclama", "agenda cheia", "preço parado"];
const S7: React.FC<{ t: number }> = ({ t }) => {
  if (t < T(70) - 0.1) return null;
  const h = pop(t, T(70) + 0.1, 0.3, 0.9, 1.2);
  return (
    <>
      {[1, 2, 3].map((n, k) => {
        const p = pop(t, T(72) + 0.12 * k, 0.28, 0.4, 2.2);
        const bob = t > T(74) ? 6 * Math.sin((t - T(74)) * 5 + k * 1.3) : 0;
        if (p.al <= 0) return null;
        return (
          <At key={n} x={540 + (k - 1) * 250} y={655 + p.dy + bob} sc={p.sc} al={p.al}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ scale: "0.82" }}><Chip n={n} on={false} /></div>
              <div style={{ background: C.white, borderRadius: 22, padding: "6px 14px", boxShadow: shadow, fontFamily: FONT, fontWeight: 700, fontSize: 25, color: C.ink, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                {ROT[k]}
              </div>
            </div>
          </At>
        );
      })}
      {h.al > 0 && (
        <At x={540} y={1582 + h.dy} al={h.al}>
          <div style={{ background: "rgba(255,255,255,0.92)", borderRadius: 30, padding: "8px 22px", fontFamily: FONT, fontWeight: 700, fontSize: 32, color: C.ink2, boxShadow: shadow }}>
            @legalizai.app
          </div>
        </At>
      )}
    </>
  );
};

// ---------- ponte: cobrar mais faz faturar mais, e o MEI tem teto
const Bridge: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T(51) - 0.3, t1 = T(70) - 0.32;
  if (t < t0 || t > t1 + 0.3) return null;
  const p = pop(t, t0, 0.32, 0.8, 1.4);
  const fo = leave(t, t1, 0.26);
  return (
    <At x={262 - (1 - fo) * 150} y={735 + p.dy} sc={p.sc} al={p.al * fo}>
      <div style={{ width: 400, background: C.tint, border: `3px solid ${C.coral}`, borderRadius: 26, padding: "16px 22px", boxSizing: "border-box", fontFamily: FONT, fontWeight: 700, fontSize: 31, lineHeight: 1.18, color: C.coral7, letterSpacing: "-0.01em", textAlign: "center" }}>
        Cobrou mais, faturou mais. E o MEI tem teto.
      </div>
    </At>
  );
};

// ---------- app + teto do MEI
const Phone: React.FC = () => (
  <div style={{ width: 262, height: 546, background: C.ink, borderRadius: 46, padding: 10, boxSizing: "border-box", boxShadow: "0 22px 40px rgba(27,30,36,0.25)", position: "relative" }}>
    <Img src={staticFile("splash.png")} style={{ width: "100%", height: "100%", borderRadius: 38, objectFit: "cover", display: "block" }} />
    <div style={{ position: "absolute", left: 94, top: 22, width: 74, height: 22, borderRadius: 11, background: C.ink }} />
  </div>
);

const Meter: React.FC<{ fill: number; val: number; eye: number }> = ({ fill, val, eye }) => (
  <div style={{ width: 446, background: C.white, borderRadius: 32, padding: "26px 30px 24px", boxSizing: "border-box", boxShadow: shadow, position: "relative" }}>
    <div style={{ position: "absolute", right: 22, top: 12, scale: "0.62", transformOrigin: "100% 0%" }}><Eye open={eye} /></div>
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 25, color: C.ink2, letterSpacing: "0.12em" }}>TETO DO MEI</div>
    <div style={{ marginTop: 16, height: 26, borderRadius: 13, background: C.alt, overflow: "hidden" }}>
      <div style={{ width: `${64 * outCubic(fill)}%`, height: "100%", borderRadius: 13, background: C.coral }} />
    </div>
    <div style={{ marginTop: 18, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: C.coral6, opacity: val, translate: `0px ${(1 - outCubic(val)) * 10}px` }}>
      R$ 81 mil por ano
    </div>
  </div>
);

const Eye: React.FC<{ open: number }> = ({ open }) => {
  const hh = 34 * Math.max(0.08, open);
  return (
    <svg width={118} height={76} viewBox="0 0 118 76" style={{ filter: "drop-shadow(0 5px 8px rgba(27,30,36,0.15))" }}>
      <ellipse cx={59} cy={38} rx={53} ry={hh} fill="#fff" stroke={C.ink} strokeWidth={6} />
      {open > 0.35 && <circle cx={59} cy={38} r={20 * Math.min(1, open)} fill={C.coral} />}
      {open > 0.35 && <circle cx={59} cy={38} r={8.4 * Math.min(1, open)} fill={C.ink} />}
    </svg>
  );
};

const S6: React.FC<{ t: number }> = ({ t }) => {
  if (t < T(51) - 0.2 || t > T(70)) return null;
  const fo = leave(t, T(70) - 0.32, 0.28);
  const dx = -(1 - fo) * 150;
  const t0 = T(52) - 0.1;
  const p = clamp01((t - t0) / 0.55);
  const k = outBack(p, 1.3);
  const lift = clamp01((t - (T(60) - 0.16)) / 0.4);
  const y = lerp(1480, 1060, k) - 30 * lift;
  const sc = lerp(0.9, 0.8, lift);
  const selo = clamp01((t - t0 - 0.35) / 0.2);
  const te = T(60) - 0.06;
  let blink = 1;
  const tb = t - te - 0.9;
  if (tb > 0 && tb < 0.2) blink = Math.abs(Math.cos((Math.PI * tb) / 0.2));
  const mt = pop(t, te, 0.3, 0.7, 1.5);
  return (
    <>
      {p > 0 && (
        <>
          <At x={215 + dx} y={y} sc={sc} al={clamp01(p * 2) * fo} rot={lerp(-12, -4, k)}><Phone /></At>
          <At x={215 + dx} y={y + 318 * sc} al={selo * fo}>
            <div style={{ background: C.alt, borderRadius: 30, padding: "10px 22px", fontFamily: FONT, fontWeight: 700, fontSize: 21, color: C.ink2, letterSpacing: "0.14em", whiteSpace: "nowrap" }}>
              APP EM CONSTRUÇÃO
            </div>
          </At>
        </>
      )}
      {mt.al > 0 && (
        <At x={262 + dx} y={1452 + mt.dy} sc={mt.sc} al={mt.al * fo}>
          <Meter fill={clamp01((t - (T(62) - 0.05)) / 0.9)} val={clamp01((t - (T(66) - 0.06)) / 0.25)} eye={clamp01((t - te - 0.1) / 0.18) * blink} />
        </At>
      )}
    </>
  );
};

// ---------- confete (cresceu), na frente do Léo
const Confetti: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const d = t - t0;
  if (d < 0 || d > 1.4) return null;
  const L = layoutAt(t);
  const cols = [C.coral, "#F7A284", C.coral6, "#FBC7B5"];
  return (
    <>
      {Array.from({ length: 46 }).map((_, i) => {
        const ang = -Math.PI / 2 + (random(`a${i}`) - 0.5) * Math.PI * 1.3;
        const v = 900 + random(`v${i}`) * 950;
        const x = L.cx + Math.cos(ang) * v * d;
        const y = 760 + Math.sin(ang) * v * d + 1500 * d * d;
        const sz = 12 + random(`s${i}`) * 16;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: sz, height: sz * (random(`r${i}`) > 0.5 ? 0.5 : 1),
              borderRadius: random(`c${i}`) > 0.6 ? "50%" : 3, background: cols[i % cols.length],
              rotate: `${d * 720 * (random(`w${i}`) - 0.5)}deg`, opacity: clamp01((1.4 - d) / 0.35),
            }}
          />
        );
      })}
    </>
  );
};

export const Cards: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <S1 t={t} />
      <S2 t={t} />
      <S3 t={t} />
      <S4 t={t} />
      <Bridge t={t} />
      <S6 t={t} />
      <S7 t={t} />
      <Confetti t={t} t0={T(50) - 0.02} />
    </AbsoluteFill>
  );
};

