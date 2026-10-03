import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, FPS, T, TL, clamp01, leave, lerp, outBack, outCubic } from "../lib/tl";
import { layoutAt } from "./LeoLayer";

const BEAT0 = 0.61;
const BEAT = 60 / 81;

// disco coral atrás do Léo, com anéis na batida (gancho e CTA)
const Disc: React.FC<{ t: number; t0: number; t1: number; y: number; d: number }> = ({ t, t0, t1, y, d }) => {
  if (t < t0 - 0.4 || t > t1 + 0.4) return null;
  const kin = t0 <= 0 ? 1 : outBack(clamp01((t - t0) / 0.45), 1.6);
  const kout = leave(t, t1, 0.3);
  const L = layoutAt(t);
  const sc = kin * kout;
  const rings = [];
  if (t >= BEAT0) {
    const n = Math.floor((t - BEAT0) / BEAT);
    for (let k = Math.max(0, n - 1); k <= n; k++) {
      const ph = (t - (BEAT0 + k * BEAT)) / 1.1;
      if (ph < 0 || ph > 1) continue;
      rings.push(
        <div
          key={k}
          style={{
            position: "absolute",
            left: L.cx - (d / 2) * (1 + 0.28 * ph),
            top: y - (d / 2) * (1 + 0.28 * ph),
            width: d * (1 + 0.28 * ph),
            height: d * (1 + 0.28 * ph),
            borderRadius: "50%",
            border: `${(10 * (1 - ph)).toFixed(1)}px solid ${C.coral}`,
            opacity: 0.55 * (1 - ph) * kout,
          }}
        />,
      );
    }
  }
  return (
    <>
      {rings}
      <div
        style={{
          position: "absolute",
          left: L.cx - d / 2,
          top: y - d / 2,
          width: d,
          height: d,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 32%, #F7835F 0%, ${C.coral} 55%, ${C.coral6} 100%)`,
          scale: `${sc}`,
        }}
      />
    </>
  );
};

// numeral gigante do sinal
const BigNum: React.FC<{ t: number; n: number; t0: number; t1: number }> = ({ t, n, t0, t1 }) => {
  if (t < t0 - 0.1 || t > t1 + 0.35) return null;
  const k = clamp01((t - t0) / 0.5);
  const e = outBack(k, 1.5);
  const kout = leave(t, t1, 0.3);
  const L = layoutAt(t);
  return (
    <div
      style={{
        position: "absolute",
        left: L.cx - 450 + (n === 1 ? 170 : 0),
        width: 900,
        top: 560,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 1180,
        lineHeight: 1,
        letterSpacing: "-0.06em",
        color: C.coral,
        opacity: clamp01(k * 3) * kout,
        scale: `${lerp(0.55, 1, e) * lerp(0.85, 1, kout)}`,
        rotate: `${lerp(-16, 0, e) + (1 - kout) * 10}deg`,
        translate: `0px ${((1 - kout) * 80).toFixed(1)}px`,
      }}
    >
      {n}
    </div>
  );
};

// raios de sol girando (cresceu)
const Rays: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 || t > t1 + 0.4) return null;
  const k = outCubic((t - t0) / 0.5) * leave(t, t1, 0.35);
  const L = layoutAt(t);
  const n = 18;
  const rays = [];
  for (let i = 0; i < n; i++) {
    rays.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: -40,
          top: -1400,
          width: 80,
          height: 1400,
          transformOrigin: "50% 100%",
          rotate: `${(i * 360) / n}deg`,
          background: `linear-gradient(to top, rgba(242,100,60,0.0), rgba(242,100,60,${i % 2 ? 0.16 : 0.28}))`,
          clipPath: "polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)",
        }}
      />,
    );
  }
  return (
    <div style={{ position: "absolute", left: L.cx, top: 980, scale: `${k}`, rotate: `${(t - t0) * 14}deg` }}>{rays}</div>
  );
};

// seta grande subindo (reajustar)
const BigArrow: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 || t > t1 + 0.3) return null;
  const k = outBack(clamp01((t - t0) / 0.55), 1.4);
  const kout = leave(t, t1, 0.25);
  return (
    <svg
      width={700}
      height={1100}
      viewBox="0 0 620 900"
      style={{ position: "absolute", left: 190, top: lerp(1700, 640, k), opacity: kout, rotate: `${(1 - k) * -8}deg` }}
    >
      <path d="M310 0 L610 330 L425 330 L425 900 L195 900 L195 330 L10 330 Z" fill={C.coral} />
    </svg>
  );
};

export const Backdrop: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const end = TL.endT0;
  return (
    <AbsoluteFill>
      <Disc t={t} t0={0} t1={T(10) - 0.35} y={1230} d={1000} />
      <BigNum t={t} n={1} t0={T(10) - 0.12} t1={T(17) - 0.34} />
      <BigNum t={t} n={2} t0={T(17) - 0.12} t1={T(25) - 0.34} />
      <BigNum t={t} n={3} t0={T(25) - 0.12} t1={T(35) - 0.34} />
      <BigArrow t={t} t0={T(41) - 0.1} t1={T(42) - 0.3} />
      <Rays t={t} t0={T(42) - 0.2} t1={T(51) - 0.3} />
      <Disc t={t} t0={T(70) - 0.3} t1={end + 5} y={1250} d={960} />
    </AbsoluteFill>
  );
};

