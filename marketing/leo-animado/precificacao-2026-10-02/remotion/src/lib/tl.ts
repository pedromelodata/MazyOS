import timeline from "../data/timeline.json";

export const TL = timeline;
export const FPS = timeline.fps;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// cores da marca
export const C = {
  bg: "#FAF8F5",
  ink: "#1B1E24",
  ink2: "#524E48",
  coral: "#F2643C",
  coral6: "#DD4E27",
  coral7: "#B83D1C",
  tint: "#FEF3EE",
  hair: "#E3DED7",
  alt: "#F1EEE9",
  white: "#FFFFFF",
};
export const FONT = "Sora";

/** início (s) da palavra i da narração */
export const T = (i: number) => timeline.words[i].s;
export const TE = (i: number) => timeline.words[i].e;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const inOutCubic = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const outBack = (t: number, s = 1.9) => {
  t = clamp01(t) - 1;
  return 1 + (s + 1) * t * t * t + s * t * t;
};
export const smooth = (t: number) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};

/** entrada com overshoot: escala, opacidade e deslocamento vertical */
export const pop = (t: number, t0: number, dur = 0.26, s0 = 0.55, over = 1.9) => {
  const p = (t - t0) / dur;
  if (p <= 0) return { sc: 0, al: 0, dy: 0 };
  return { sc: lerp(s0, 1, outBack(p, over)), al: clamp01(p / 0.35), dy: (1 - outCubic(p)) * 26 };
};

/** fator de saída (1 -> 0) a partir de t1 */
export const leave = (t: number, t1: number, dur = 0.18) => (t < t1 ? 1 : 1 - outCubic((t - t1) / dur));

/** pulso seno curto (0..1..0) começando em t0 */
export const pulse = (t: number, t0: number, dur: number) => {
  const d = t - t0;
  if (d < 0 || d > dur) return 0;
  return Math.sin((Math.PI * d) / dur);
};
