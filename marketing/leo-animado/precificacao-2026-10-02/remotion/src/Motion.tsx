import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import "./lib/font";
import { C, FONT, FPS, clamp01, inOutCubic, lerp, outBack, outCubic } from "./lib/tl";
import { M, PUNCH_I, SCENES, TI, TIw } from "./lib/tli";
import { AppleCaptions, CapMode } from "./parts/AppleCaptions";
import {
  AlarmClock, At, BigArrow, Bg, BgKind, Bubble, Calendar, Check, ClayCard, CO, CommentIcon, Confetti, DK, Eye, HangTag,
  NumDot, Numeral, Padlock, Phone, Pill, ROT, Rays, SH, Sparkle, Stamp, Sticker, TetoCard, YearOdo, inn, shake, spring,
} from "./motion/kit";

// Versão 100% motion (sem o Léo): "3 sinais de que você já pode cobrar mais caro", narração institucional.
const BEAT0 = 0.61;
const BEAT = 60 / 81;

type Kind = "iris" | "push" | "zoom" | "slideUp" | "wipeUp";
// transição entre a cena i e a i+1 (centrada no fim da cena i)
const TR: { kind: Kind; d: number; ox?: number; oy?: number }[] = [
  { kind: "iris", d: 0.5, ox: 540, oy: 730 },
  { kind: "push", d: 0.44 },
  { kind: "zoom", d: 0.46 },
  { kind: "slideUp", d: 0.44 },
  { kind: "wipeUp", d: 0.42 },
  { kind: "zoom", d: 0.46 },
  { kind: "iris", d: 0.52, ox: 540, oy: 1150 },
];
const BG: BgKind[] = ["coral", "paper", "paper", "dark", "paper", "coral", "dark", "paper"];
const CAP: CapMode[] = ["coral", "light", "light", "dark", "light", "light", "coral", "dark", "dark", "light"];
const STAMP_T = M.cheia + 0.12;
const LOCK_T = M.mesmo - 0.02;
const SHAKES: [number, number][] = [[STAMP_T, 16], [LOCK_T + 0.12, 10], [M.reajustar, 22], [M.cresceu, 20], [M.n81, 8]];

// ---------- câmera: empurrão lento + socos nas palavras-chave + tremidas
const Camera: React.FC<{ i: number; t: number; children: React.ReactNode }> = ({ i, t, children }) => {
  const s = SCENES[i];
  const u = clamp01((t - s.t0) / (s.t1 - s.t0));
  let sc = 1 + 0.04 * inOutCubic(u);
  let rot = 0;
  let dx = 0;
  let dy = 0;
  PUNCH_I.forEach((pt, k) => {
    if (pt >= s.t0 - 0.1 && pt < s.t1) {
      sc += spring(t, pt - 0.03, 0.055, 2.4, 6);
      rot += spring(t, pt - 0.03, k % 2 ? 1.2 : -1.2, 2.4, 6);
    }
  });
  SHAKES.forEach(([ts, a], k) => {
    if (ts >= s.t0 && ts < s.t1) {
      dx += shake(t, ts, a, k * 1.7);
      dy += shake(t, ts, a * 0.7, k * 2.3 + 1);
    }
  });
  return (
    <AbsoluteFill style={{ scale: `${sc}`, rotate: `${rot.toFixed(3)}deg`, translate: `${dx.toFixed(2)}px ${dy.toFixed(2)}px`, transformOrigin: "50% 58%" }}>
      {children}
    </AbsoluteFill>
  );
};

// ---------- cena com transição de entrada e saída
const Scene: React.FC<{ i: number; t: number; children: React.ReactNode }> = ({ i, t, children }) => {
  const s = SCENES[i];
  const tin = i > 0 ? TR[i - 1] : null;
  const tout = i < SCENES.length - 1 ? TR[i] : null;
  const a = s.t0 - (tin ? tin.d / 2 : 0);
  const b = s.t1 + (tout ? tout.d / 2 : 0);
  if (t < a || t > b) return null;
  const wrap: React.CSSProperties = {};
  const cont: React.CSSProperties = {};
  let z = i * 2;
  if (tin && t < s.t0 + tin.d / 2) {
    const p = clamp01((t - a) / tin.d);
    const e = inOutCubic(p);
    const bl = Math.sin(Math.PI * p);
    if (tin.kind === "iris") wrap.clipPath = `circle(${(e * 2250).toFixed(1)}px at ${tin.ox}px ${tin.oy}px)`;
    if (tin.kind === "push") { wrap.translate = `${((1 - e) * 1080).toFixed(1)}px 0px`; wrap.filter = `blur(${(bl * 10).toFixed(2)}px)`; }
    if (tin.kind === "zoom") { cont.scale = `${lerp(0.7, 1, outCubic(p))}`; cont.filter = `blur(${((1 - outCubic(p)) * 14).toFixed(2)}px)`; }
    if (tin.kind === "slideUp") { wrap.translate = `0px ${((1 - e) * 1920).toFixed(1)}px`; wrap.filter = `blur(${(bl * 12).toFixed(2)}px)`; }
    if (tin.kind === "wipeUp") { wrap.clipPath = `inset(${((1 - e) * 100).toFixed(2)}% 0% 0% 0%)`; cont.translate = `0px ${((1 - e) * 260).toFixed(1)}px`; }
  }
  if (tout && t > s.t1 - tout.d / 2) {
    const p = clamp01((t - (s.t1 - tout.d / 2)) / tout.d);
    const e = inOutCubic(p);
    const bl = Math.sin(Math.PI * p);
    if (tout.kind === "iris") wrap.scale = `${1 + 0.07 * e}`;
    if (tout.kind === "push") { wrap.translate = `${(-e * 1080).toFixed(1)}px 0px`; wrap.filter = `blur(${(bl * 10).toFixed(2)}px)`; }
    if (tout.kind === "zoom") { wrap.scale = `${1 + 1.6 * e * e}`; wrap.opacity = 1 - e; wrap.filter = `blur(${(e * 16).toFixed(2)}px)`; z = 100; }
    if (tout.kind === "slideUp") { wrap.translate = `0px ${(-e * 1920).toFixed(1)}px`; wrap.filter = `blur(${(bl * 12).toFixed(2)}px)`; }
    if (tout.kind === "wipeUp") wrap.translate = `0px ${(-e * 320).toFixed(1)}px`;
  }
  return (
    <AbsoluteFill style={{ zIndex: z, ...wrap }}>
      <Bg kind={BG[i]} t={t} />
      <AbsoluteFill style={cont}>
        <Camera i={i} t={t}>{children}</Camera>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- gancho: "3 sinais" aceso desde o quadro 0
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const cy = 730;
  const bob = Math.sin(t * 2.2) * 7;
  const rings: React.ReactNode[] = [];
  if (t >= BEAT0) {
    const n = Math.floor((t - BEAT0) / BEAT);
    for (let k = Math.max(0, n - 1); k <= n; k++) {
      const ph = (t - (BEAT0 + k * BEAT)) / 1.25;
      if (ph < 0 || ph > 1) continue;
      const d = 780 * (1 + 0.5 * ph);
      rings.push(
        <At key={k} x={540} y={cy}>
          <div style={{ width: d, height: d, borderRadius: "50%", border: `${(12 * (1 - ph)).toFixed(1)}px solid rgba(255,255,255,${(0.4 * (1 - ph)).toFixed(3)})`, boxSizing: "border-box" }} />
        </At>,
      );
    }
  }
  const glow = clamp01((t - (TIw(1) - 0.05)) / 0.25) * (1 - clamp01((t - (TIw(1) + 0.5)) / 0.5));
  return (
    <>
      {Array.from({ length: 18 }).map((_, k) => {
        const y = 1960 - ((t * (50 + random(`pv${k}`) * 60) + random(`py${k}`) * 2100) % 2100);
        const sz = 6 + random(`ps${k}`) * 10;
        return <div key={k} style={{ position: "absolute", left: random(`px${k}`) * 1080, top: y, width: sz, height: sz, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />;
      })}
      {rings}
      <At x={540} y={cy} sc={1 + spring(t, TIw(0) - 0.02, 0.05, 2.2, 5)}>
        <div style={{ width: 780, height: 780, borderRadius: "50%", background: C.coral }} />
      </At>
      <At x={540} y={cy + bob * 0.5} sc={1 + spring(t, TIw(0) - 0.02, 0.11, 2.4, 5.5)} rot={spring(t, TIw(0) - 0.02, -5, 2.4, 5.5)}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 820, lineHeight: 1, color: "#fff", letterSpacing: "-0.05em", textShadow: "0 30px 60px rgba(92,31,15,0.35)" }}>3</div>
      </At>
      <At x={872} y={420 + bob} rot={12 + spring(t, TIw(1) - 0.02, 14, 2.2, 5)} sc={1 + spring(t, TIw(1) - 0.02, 0.2, 2.2, 5)}>
        <div style={{ position: "relative" }}>
          {glow > 0 &&
            Array.from({ length: 8 }).map((_, k) => (
              <div
                key={k}
                style={{
                  position: "absolute", left: 115 - 9, top: 115 - 170, width: 18, height: 50, borderRadius: 9, background: "#fff",
                  transformOrigin: "9px 170px", rotate: `${k * 45}deg`, opacity: glow, scale: `1 ${lerp(0.3, 1, glow)}`,
                }}
              />
            ))}
          <Sticker icon="lampada" d={230} pad={0.08} />
        </div>
      </At>
      <At x={540} y={1188} sc={1 + spring(t, TIw(1) - 0.02, 0.09, 2.6, 6)}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 184, lineHeight: 1, color: C.ink, letterSpacing: "-0.045em" }}>sinais</div>
      </At>
      <At x={540} y={1336} sc={1 + spring(t, TIw(6) - 0.02, 0.04, 2.6, 6)}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 60, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>de que você já pode cobrar</div>
      </At>
      <At x={540} y={1482} rot={-3 + spring(t, TIw(9) - 0.02, 4, 2.4, 5.5)} sc={1 + spring(t, TIw(8) - 0.02, 0.05, 2.6, 6) + spring(t, TIw(9) - 0.02, 0.12, 2.4, 5.5)}>
        <div style={{ background: C.ink, borderRadius: 30, padding: "8px 40px 16px", fontFamily: FONT, fontWeight: 800, fontSize: 128, color: "#fff", letterSpacing: "-0.04em", whiteSpace: "nowrap", boxShadow: "0 24px 50px rgba(92,31,15,0.35)" }}>
          mais caro
        </div>
      </At>
      <At x={170} y={1408}><Sparkle s={0.9 + 0.5 * Math.sin(t * 6)} /></At>
      <At x={930} y={1560}><Sparkle s={0.7 + 0.4 * Math.sin(t * 5 + 2)} /></At>
      <At x={205} y={420}><Sparkle s={0.6 + 0.35 * Math.sin(t * 4.4 + 1)} /></At>
    </>
  );
};

// ---------- sinal 1: clientes aceitando o preço
const S1: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[1].t0;
  const n1 = inn(t, t0 - 0.08, 0.55, 0.6, 1.4);
  const card = inn(t, t0 + 0.02, 0.5, 0.5, 1.6);
  const bob = Math.sin((t - t0) * 2.4) * 8;
  const B: [string, number, number, number, "l" | "r"][] = [
    ["Fechado, pode marcar!", M.seus, 1000, 790, "r"],
    ["Perfeito, combinado.", M.clientes, 60, 1470, "l"],
    ["Tem horário na semana que vem?", M.nunca, 960, 1590, "r"],
  ];
  return (
    <>
      <At x={178} y={1070} sc={lerp(0.7, 1, outCubic(n1.k))} al={n1.al} rot={lerp(-30, -8, outBack(n1.k, 1.4))}>
        <Numeral n={1} />
      </At>
      <At x={628} y={1170 + bob} sc={card.sc} al={card.al} rot={lerp(10, -3, outCubic(card.k))}>
        <ClayCard seq="cadastro" frame={(t - (t0 + 0.02)) * 48} size={600} />
      </At>
      {B.map(([txt, ts, x, y, side]) => {
        const p = inn(t, ts - 0.04, 0.34, 0.4, 2);
        if (p.al <= 0) return null;
        const fl = Math.sin((t - ts) * 2.8 + x) * 5;
        return (
          <div
            key={txt}
            style={{
              position: "absolute", top: y + fl, left: side === "l" ? x : undefined, right: side === "r" ? 1080 - x : undefined,
              translate: `0px -50%`, scale: `${p.sc}`, opacity: p.al, transformOrigin: side === "l" ? "0% 100%" : "100% 100%",
            }}
          >
            <Bubble text={txt} side={side} />
          </div>
        );
      })}
    </>
  );
};

// ---------- sinal 2: agenda cheia, meses à frente
const S2: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[2].t0;
  const n2 = inn(t, t0 - 0.05, 0.55, 0.6, 1.4);
  const months: [string, number][] = [["OUT", t0 + 0.02], ["NOV", M.meses - 0.06], ["DEZ", M.frente - 0.06]];
  const shown = months.filter(([, ts]) => t >= ts);
  const depth = shown.length - 1;
  const ic = inn(t, M.sua - 0.05, 0.4, 0.3, 2);
  const st = clamp01((t - STAMP_T) / 0.13);
  return (
    <>
      <At x={870} y={1120} sc={lerp(0.7, 1, outCubic(n2.k))} al={n2.al} rot={lerp(28, 8, outBack(n2.k, 1.4))}>
        <Numeral n={2} />
      </At>
      {shown.map(([m, ts], k) => {
        const lvl = depth - k;
        const p = inn(t, ts, 0.42, 0.6, 1.5);
        const x = 490 - lvl * 46 + (1 - outCubic(p.k)) * 260;
        const y = 1150 - lvl * 96 + (1 - outCubic(p.k)) * 320;
        const fill = m === "OUT" ? { t0: M.agenda - 0.05, dur: 0.5 } : { t0: ts - 10, dur: 0.01 };
        return (
          <At key={m} x={x} y={y} sc={p.sc * (1 - 0.07 * lvl)} al={p.al * (1 - 0.14 * lvl)} rot={lerp(8, -4 + lvl * 2, outCubic(p.k))}>
            <div style={{ position: "relative" }}>
              <Calendar month={m} t={t} t0={fill.t0} dur={fill.dur} />
              {m === "OUT" && st > 0 && (
                <div style={{ position: "absolute", left: 270, top: 330, translate: "-50% -50%", rotate: "-14deg", scale: `${lerp(2.4, 1, st * st)}`, opacity: clamp01(st * 3) }}>
                  <Stamp text="LOTADA" />
                </div>
              )}
            </div>
          </At>
        );
      })}
      {ic.al > 0 && (
        <At x={236} y={770 + Math.sin(t * 2.6) * 7} sc={ic.sc} al={ic.al} rot={-12 + spring(t, M.sua, 10, 2.2, 5)}>
          <Sticker icon="calendario" d={230} pad={0.06} />
        </At>
      )}
    </>
  );
};

// ---------- sinal 3: mesmo preço de dois anos atrás (escuro)
const S3: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[3].t0;
  const n3 = inn(t, t0 - 0.05, 0.6, 1.25, 1.2);
  // a etiqueta entra balançando de lado, presa no barbante (pêndulo amortecido)
  const rel = t0 + 0.02;
  let ang = -100;
  if (t > rel) {
    const d = t - rel;
    ang = -100 * Math.exp(-1.5 * d) * Math.cos(4.4 * d);
    if (t > M.cobra - 0.05) ang += 8 * Math.exp(-2 * (t - M.cobra + 0.05)) * Math.sin(6 * (t - M.cobra + 0.05));
    if (t > LOCK_T + 0.15) ang *= Math.exp(-7 * (t - LOCK_T - 0.15));
  }
  const L = 250;
  const TS = 1.12;
  const lock = clamp01((t - LOCK_T) / 0.28);
  const shut = clamp01((t - LOCK_T - 0.2) / 0.1);
  const odo = inn(t, M.doisanos - 0.06, 0.4, 0.5, 1.8);
  const digit = 4 + outCubic((t - (M.anos - 0.05)) / 0.2) + outCubic((t - (M.atras - 0.05)) / 0.2);
  return (
    <>
      <At x={230} y={1180} sc={lerp(1.25, 1, outCubic(n3.k))} al={clamp01(n3.al) * 0.95} rot={-7}>
        <Numeral n={3} outline />
      </At>
      <div style={{ position: "absolute", left: 590, top: 640, rotate: `${ang.toFixed(3)}deg`, transformOrigin: "0px 0px" }}>
        <div style={{ position: "absolute", left: -4, top: -40, width: 8, height: L + 40, background: DK.text2, borderRadius: 4 }} />
        <div style={{ position: "absolute", left: -135 * TS, top: L - 82 * TS, scale: `${TS}`, transformOrigin: "0 0" }}>
          <HangTag />
        </div>
        {lock > 0 && (
          <div style={{ position: "absolute", left: -75, top: L * 0.3 - 95 - (1 - outBack(lock, 1.6)) * 260, opacity: clamp01(lock * 4) }}>
            <Padlock shut={shut} />
          </div>
        )}
      </div>
      {odo.al > 0 && (
        <At x={590} y={1470} sc={odo.sc} al={odo.al}>
          <YearOdo digit={digit} />
        </At>
      )}
    </>
  );
};

// ---------- bateu dois? + hora de reajustar
const S4: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[4].t0;
  const card = inn(t, t0 + 0.02, 0.42, 0.6, 1.6);
  const out1 = clamp01((t - (M.ta - 0.12)) / 0.3);
  const clk = inn(t, M.ta - 0.08, 0.36, 0.3, 2);
  const clkOut = clamp01((t - (M.reajustar - 0.14)) / 0.2);
  const spin = 10.25 + 1.6 * outCubic((t - (M.ta - 0.05)) / 0.6);
  const dr = t - M.hora + 0.02;
  const ring = dr > 0 && dr < 0.9 ? Math.sin(2 * Math.PI * 13 * dr) * Math.exp(-3.2 * dr) : 0;
  const ar = clamp01((t - (M.reajustar - 0.12)) / 0.5);
  return (
    <>
      {out1 < 1 && card.al > 0 && (
        <At x={lerp(540, 300, outCubic(out1))} y={lerp(1110, 690, outCubic(out1))} sc={card.sc * lerp(1, 0.45, outCubic(out1))} al={card.al * (1 - out1)} rot={lerp(0, -10, out1)}>
          <div style={{ width: 920, background: C.white, borderRadius: 44, padding: "30px 36px", boxSizing: "border-box", boxShadow: SH, border: `2px solid ${C.hair}` }}>
            {ROT.map((r, k) => {
              const rp = inn(t, t0 + 0.08 + 0.07 * k, 0.32, 0.6, 1.8);
              const on = k < 2 ? clamp01((t - (M.doisq + 0.1 * k)) / 0.22) : 0;
              return (
                <div
                  key={r}
                  style={{
                    display: "flex", alignItems: "center", gap: 30, padding: "24px 24px", borderRadius: 30, marginTop: k ? 12 : 0,
                    background: on > 0 ? C.tint : "transparent", opacity: rp.al * (k === 2 && t > M.doisq + 0.3 ? 0.55 : 1),
                    translate: `${((1 - outCubic(rp.k)) * 80).toFixed(1)}px 0px`,
                  }}
                >
                  <NumDot n={k + 1} size={100} filled={on > 0} />
                  <div style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: 54, color: C.ink, letterSpacing: "-0.02em" }}>{r}</div>
                  <div style={{ scale: `${1 + spring(t, M.doisq + 0.1 * k, k < 2 ? 0.25 : 0, 2.6, 6)}` }}>
                    <Check on={on} size={98} />
                  </div>
                </div>
              );
            })}
          </div>
        </At>
      )}
      {clk.al > 0 && clkOut < 1 && (
        <At x={540} y={1080 + clkOut * 500} sc={clk.sc * (1 - 0.5 * clkOut)} al={clk.al * (1 - clkOut)} rot={-4}>
          <AlarmClock spin={spin} ring={ring} />
        </At>
      )}
      {ar > 0 && (
        <>
          <At x={540} y={lerp(2500, 1130, outBack(ar, 1.2))} rot={(1 - ar) * -10}>
            <BigArrow w={600} />
          </At>
          <At x={540} y={lerp(2500, 1130, outBack(ar, 1.2)) - 330} sc={1 + spring(t, M.reajustar + 0.25, 0.2, 2.4, 5)}>
            <div style={{ width: 190, height: 190, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SH }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, color: C.coral6, letterSpacing: "-0.03em" }}>R$</span>
            </div>
          </At>
        </>
      )}
    </>
  );
};

// ---------- cobrar mais é o negócio dizendo que cresceu (coral)
const S5: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[5].t0;
  const ray = outCubic((t - t0) / 0.6);
  const disc = inn(t, t0 + 0.08, 0.5, 0.3, 1.7);
  const plus = inn(t, M.cobrar + 0.2, 0.34, 0.3, 2.2);
  const bob = Math.sin((t - t0) * 2.5) * 9;
  const flash = clamp01(1 - (t - M.cresceu) / 0.22) * (t >= M.cresceu ? 1 : 0);
  return (
    <>
      <div style={{ position: "absolute", left: 540, top: 1130, scale: `${ray}`, rotate: `${((t - t0) * 12).toFixed(2)}deg` }}>
        <Rays n={20} len={1500} a1={0.08} a2={0.16} />
      </div>
      {Array.from({ length: 9 }).map((_, k) => {
        const st = M.cobrar + 0.3 + k * 0.22;
        const d = t - st;
        if (d < 0) return null;
        const u = (d % 1.9) / 1.9;
        const x = 150 + random(`ux${k}`) * 780;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: lerp(1720, 700, u), opacity: Math.sin(Math.PI * u) * 0.55, translate: "-50% -50%" }}>
            <svg width={60} height={70} viewBox="0 0 60 70">
              <path d="M30 4 L56 34 H40 V66 H20 V34 H4 Z" fill="#fff" />
            </svg>
          </div>
        );
      })}
      <At x={540} y={1130 + bob} sc={disc.sc * (1 + spring(t, M.negocio, 0.05, 2.4, 6) + spring(t, M.cresceu - 0.02, 0.14, 2.2, 5))} al={disc.al}>
        <div style={{ width: 640, height: 640, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(92,31,15,0.35)" }}>
          <Img src={staticFile("icons/growth.webp")} style={{ width: 520, height: 520 }} />
        </div>
      </At>
      {plus.al > 0 && (
        <At x={842} y={850 + bob * 0.6} sc={plus.sc} al={plus.al} rot={10}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 36px rgba(92,31,15,0.35)" }}>
            <svg width={92} height={92} viewBox="0 0 92 92"><path d="M46 10 V82 M10 46 H82" stroke="#fff" strokeWidth={17} strokeLinecap="round" /></svg>
          </div>
        </At>
      )}
      <Confetti t={t} t0={M.cresceu - 0.02} x={540} y={1060} cols={["#FFFFFF", C.ink, CO.c200, CO.c100]} n={64} />
      {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.4 }} />}
    </>
  );
};

// ---------- app que tá chegando + teto do MEI (escuro)
const S6: React.FC<{ t: number }> = ({ t }) => {
  const t0 = SCENES[6].t0;
  const br = inn(t, t0 + 0.06, 0.42, 0.7, 1.5);
  const ph = clamp01((t - (M.app - 0.14)) / 0.6);
  const py = lerp(2350, 1235, outBack(ph, 1.25));
  const eye = inn(t, M.olho - 0.06, 0.34, 0.4, 1.8);
  const tb = t - 19.95;
  const blink = tb > 0 && tb < 0.22 ? Math.abs(Math.cos((Math.PI * tb) / 0.22)) : 1;
  const open = clamp01((t - M.olho) / 0.2) * blink;
  const card = inn(t, M.teto - 0.06, 0.4, 0.6, 1.6);
  const px = lerp(540, 330, inOutCubic((t - (M.olho - 0.4)) / 0.5));
  return (
    <>
      {br.al > 0 && (
        <At x={540} y={730} sc={br.sc} al={br.al}>
          <div style={{ width: 720, background: DK.card, border: `3px solid ${C.coral}`, borderRadius: 30, padding: "18px 30px", boxSizing: "border-box", fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.22, color: DK.text, letterSpacing: "-0.015em", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
            Cobrou mais, faturou mais.<br /><span style={{ color: C.coral }}>E o MEI tem teto.</span>
          </div>
        </At>
      )}
      {ph > 0 && (
        <>
          <div style={{ position: "absolute", left: px - 280, top: py + 300, width: 560, height: 180, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(242,100,60,0.5), rgba(242,100,60,0))", opacity: clamp01(ph * 2) }} />
          <At x={px} y={py} rot={lerp(-16, -6, outCubic(ph)) + ((px - 330) / 210) * 6}>
            <Phone w={300} />
          </At>
          <At x={px} y={py + 372} al={clamp01((ph - 0.5) * 3)}>
            <div style={{ background: DK.alt, borderRadius: 30, padding: "10px 24px", fontFamily: FONT, fontWeight: 700, fontSize: 24, color: DK.text2, letterSpacing: "0.14em", whiteSpace: "nowrap" }}>APP EM CONSTRUÇÃO</div>
          </At>
        </>
      )}
      {eye.al > 0 && (
        <At x={752} y={965 + Math.sin(t * 2.4) * 6} sc={eye.sc} al={eye.al}>
          <Eye open={open} w={250} look={t > M.teto ? 0.25 : 0} />
        </At>
      )}
      {card.al > 0 && (
        <At x={735} y={1290} sc={card.sc * (1 + spring(t, M.n81 - 0.02, 0.06, 2.4, 6))} al={card.al}>
          <TetoCard fill={clamp01((t - (M.teto + 0.05)) / 0.9)} val={clamp01((t - (M.n81 - 0.06)) / 0.25)} />
        </At>
      )}
    </>
  );
};

// ---------- CTA
const CTA: React.FC<{ t: number }> = ({ t }) => {
  const ic = inn(t, M.comenta - 0.06, 0.4, 0.3, 2);
  const at = inn(t, M.voce2 - 0.1, 0.32, 0.6, 1.8);
  return (
    <>
      {ic.al > 0 && (
        <At x={540} y={900 + Math.sin(t * 2.6) * 8} sc={ic.sc} al={ic.al} rot={-4 + spring(t, M.comenta, 6, 2.2, 5)}>
          <CommentIcon t={t} w={390} />
        </At>
      )}
      {[0, 1, 2].map((k) => {
        const p = inn(t, M.quais + 0.14 * k, 0.32, 0.4, 2.2);
        if (p.al <= 0) return null;
        const bob = Math.sin((t - M.quais) * 3.4 + k * 1.2) * 7;
        const jump = spring(t, M.tem + 0.08 * k, -60, 1.6, 5);
        return (
          <At key={k} x={250 + 290 * k} y={1290 + bob + jump} sc={p.sc} al={p.al}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <NumDot n={k + 1} size={132} />
              <Pill size={30}>{ROT[k]}</Pill>
            </div>
          </At>
        );
      })}
      {at.al > 0 && (
        <At x={540} y={1540} sc={at.sc} al={at.al}>
          <Pill size={38} color={C.ink2}>@legalizai.app</Pill>
        </At>
      )}
    </>
  );
};

const SCENE_C = [Hook, S1, S2, S3, S4, S5, S6, CTA];

export const Motion: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const end = clamp01((t - TI.endT0) / (TI.dur - TI.endT0));
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {SCENE_C.map((S, i) => (
        <Scene key={i} i={i} t={t}>
          <S t={t} />
        </Scene>
      ))}
      <AbsoluteFill style={{ zIndex: 200, opacity: 1 - clamp01((t - TI.endT0) / 0.22) }}>
        <AppleCaptions tl={TI} top={250} height={340} size={72} skip={[0]} mode={(n) => CAP[n]} />
      </AbsoluteFill>
      {end > 0 && (
        <AbsoluteFill style={{ zIndex: 300, background: C.coral6, clipPath: `circle(${(inOutCubic(end) * 2250).toFixed(1)}px at 540px 1150px)` }} />
      )}
      <Audio src={staticFile("mix-motion.wav")} />
    </AbsoluteFill>
  );
};
