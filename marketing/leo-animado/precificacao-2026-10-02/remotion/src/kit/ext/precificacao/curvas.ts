// Curvas puras da biblioteca 2D da precificação (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 5).
// Port, sem React e sem Remotion, das três funções exportadas de RM/src/motion/kit.tsx que as batidas usam:
// spring (mola), shake (tremida) e inn (entrada com mola). Os números e a ordem das contas são os do original;
// o clamp01, o lerp e o outBack vêm do próprio RM/src/lib/tl.ts (só importando). A prova de igualdade está em
// testes/equivalencia-2d.mjs (diferença zero contra o kit.tsx em 200 instantes por curva).
import { clamp01, lerp, outBack } from "../../../lib/tl";

/** mola amortecida que parte de 0 (o spring do kit.tsx): amp·e^(-amort·d)·sen(2πf·d), d = t - t0 */
export const mola = (t: number, t0: number, amp = 0.1, f = 2.6, amort = 6.5) => {
  const d = t - t0;
  if (d < 0) return 0;
  return amp * Math.exp(-amort * d) * Math.sin(2 * Math.PI * f * d);
};

/** tremida amortecida em px (o shake do kit.tsx): some depois de 0,6 s */
export const tremida = (t: number, t0: number, amp = 14, semente = 0) => {
  const d = t - t0;
  if (d < 0 || d > 0.6) return 0;
  return amp * Math.exp(-9 * d) * 0.5 * (Math.sin(83 * d + semente) + Math.sin(127 * d + 2 * semente));
};

/** entrada com mola (o inn do kit.tsx): escala sai de s0 com outBack, opacidade sobe em 30% da duração */
export const entrada = (t: number, t0: number, dur = 0.34, s0 = 0.4, over = 1.8) => {
  const p = (t - t0) / dur;
  if (p <= 0) return { sc: s0, al: 0, k: 0 };
  return { sc: lerp(s0, 1, outBack(p, over)), al: clamp01(p / 0.3), k: clamp01(p) };
};

/** a duração em que a mola cai abaixo de 1/1000 da amplitude: ln(1000)/amort */
export const duracaoMola = (amort: number) => Math.log(1000) / amort;

/** a duração fixa da tremida (o shake do kit.tsx zera depois de 0,6 s) */
export const DURACAO_TREMIDA = 0.6;
