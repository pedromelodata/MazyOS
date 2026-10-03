import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { FPS, HEIGHT, T, TL, WIDTH, clamp01, inOutCubic, lerp, outBack } from "../lib/tl";

type Lay = { s: number; cx: number; dy: number };
// escala (1 = take cheio em 1080x1920), centro x, deslocamento vertical (take ancorado na base)
export const LAYOUT: Record<string, Lay> = {
  HOOK: { s: 0.86, cx: 540, dy: 95 },
  RIGHT: { s: 0.8, cx: 745, dy: 0 },
  LEFT: { s: 0.8, cx: 335, dy: 0 },
  CENTER: { s: 0.84, cx: 540, dy: 0 },
  CLOSE: { s: 1.12, cx: 540, dy: 265 },
  END: { s: 0.72, cx: 540, dy: 0 },
};
const TR = 0.4; // troca de layout termina no início da frase

export const layoutAt = (t: number) => {
  const L = TL.layouts;
  let prev = L[0].name;
  let cur = L[0].name;
  let k = 1;
  let land = -99;
  for (let i = 0; i < L.length; i++) {
    if (t >= L[i].t - TR) {
      prev = i > 0 ? L[i - 1].name : L[i].name;
      cur = L[i].name;
      k = inOutCubic((t - (L[i].t - TR)) / TR);
      land = L[i].t;
    }
  }
  const a = LAYOUT[prev];
  const b = LAYOUT[cur];
  return { s: lerp(a.s, b.s, k), cx: lerp(a.cx, b.cx, k), dy: lerp(a.dy, b.dy, k), land, moving: k > 0 && k < 1 };
};

// grade da trilha: groove entra aos 0,61 s, 81 BPM
const BEAT0 = 0.61;
const BEAT = 60 / 81;
const SHAKE = [T(9), T(41), T(50)];

export const LeoLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const L = layoutAt(t);
  const L2 = layoutAt(t + 1 / FPS);
  const speed = Math.abs(L2.cx - L.cx) * FPS + Math.abs(L2.s - L.s) * FPS * 900; // px/s aproximados

  // entrada do vídeo: pop rápido já visível no quadro 0
  const intro = lerp(0.94, 1, outBack(clamp01((t + 0.05) / 0.4), 2.2));
  // batida da trilha: squash & stretch curtinho
  let bY = 0;
  if (t >= BEAT0) {
    const ph = (t - BEAT0) % BEAT;
    bY = Math.exp(-ph / 0.11);
  }
  // soco de zoom nas palavras fortes, inclinação alternada
  let punch = 0;
  let tilt = 0;
  TL.punch.forEach((tp, k) => {
    const d = t - tp;
    if (d >= -0.02 && d < 0.42) {
      const e = Math.sin((Math.PI * clamp01((d + 0.02) / 0.44)) ) * Math.exp(-Math.max(0, d) * 3);
      punch = Math.max(punch, e);
      tilt += (k % 2 ? -1 : 1) * 1.8 * e;
    }
  });
  // tremida
  let sx = 0;
  SHAKE.forEach((ts) => {
    const d = t - ts;
    if (d >= 0 && d < 0.45) sx += 9 * Math.sin(2 * Math.PI * d * 17) * Math.exp(-d * 9);
  });
  // pouso depois da troca de layout
  let landSq = 0;
  const dl = t - L.land;
  if (dl >= 0 && dl < 0.45) landSq = Math.sin(Math.PI * dl / 0.45) * Math.exp(-dl * 4);

  const s = L.s * intro * (1 + 0.055 * punch);
  const scaleY = 1 + 0.016 * bY + 0.03 * landSq;
  const scaleX = 1 - 0.008 * bY - 0.018 * landSq;
  const blur = Math.min(7, speed / 700);

  const w = WIDTH * s;
  const h = HEIGHT * s;
  const left = L.cx - w / 2 + sx;
  const top = HEIGHT + L.dy - h;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          transformOrigin: "50% 100%",
          scale: `${scaleX} ${scaleY}`,
          rotate: `${tilt}deg`,
          filter: [
            "drop-shadow(7px 0 0 #fff)",
            "drop-shadow(-7px 0 0 #fff)",
            "drop-shadow(0 7px 0 #fff)",
            "drop-shadow(0 -7px 0 #fff)",
            "drop-shadow(0 26px 34px rgba(27,30,36,0.20))",
            blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : "",
          ].join(" "),
        }}
      >
        <Img src={staticFile(`leo/${String(Math.min(frame, TL.frames - 1)).padStart(4, "0")}.webp`)} style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};
