import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, FPS, clamp01, outCubic } from "../lib/tl";

type Word = { i: number; t: string; s: number; e: number };
type Phrase = { w: number[]; key: number; title: boolean; s: number; e: number; out: number };
type TLData = { words: Word[]; phrases: Phrase[] };
export type CapMode = "light" | "dark" | "coral" | "video";

// cor do texto, da palavra-chave, apagado e sombra por fundo
const MODES: Record<CapMode, { base: string; key: string; dim: number; shadow: string }> = {
  light: { base: C.ink, key: C.coral6, dim: 0.2, shadow: "none" },
  dark: { base: "#F4F1EC", key: C.coral, dim: 0.3, shadow: "none" },
  coral: { base: "#FFFFFF", key: C.ink, dim: 0.42, shadow: "none" },
  video: { base: "#FFFFFF", key: "#F47F58", dim: 0.38, shadow: "0 2px 18px rgba(0,0,0,0.45)" },
};

// Legenda estilo Apple: frase inteira apagada, cada palavra acende quando é dita, uma palavra-chave em cor.
// `mode` pode variar por frase (fundo de cada cena); `skip` pula frases que já viram tipografia animada.
export const AppleCaptions: React.FC<{
  tl: TLData; top?: number; height?: number; size?: number; dark?: boolean; titleLit?: boolean;
  mode?: (phrase: number) => CapMode; skip?: number[]; left?: number; width?: number;
}> = ({ tl, top = 292, height = 330, size = 74, dark = false, titleLit = true, mode, skip = [], left = 60, width = 960 }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      {tl.phrases.map((p, n) => {
        if (skip.includes(n)) return null;
        const tin = p.title ? -0.3 : p.s - 0.1;
        const tout = p.out - 0.26;
        if (t < tin || t > tout + 0.15) return null;
        const md = MODES[mode ? mode(n) : dark ? "video" : "light"];
        const kin = outCubic((t - tin) / 0.18);
        const kout = t < tout ? 0 : outCubic((t - tout) / 0.14);
        return (
          <div
            key={n}
            style={{
              position: "absolute", left, width, top, height,
              display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.025em",
              color: md.base, opacity: kin * (1 - kout),
              filter: `blur(${((1 - kin) * 9 + kout * 9).toFixed(2)}px)`,
              translate: `0px ${((1 - kin) * 18 - kout * 22).toFixed(2)}px`,
              textShadow: md.shadow,
            }}
          >
            <div>
              {p.w.map((i) => {
                const k = p.title && titleLit ? 1 : clamp01((t - (tl.words[i].s - 0.04)) / 0.2);
                const e = outCubic(k);
                const isKey = i === p.key || (p.title && titleLit && i >= p.key - 2 && i <= p.key);
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block", marginRight: "0.24em",
                      opacity: md.dim + (1 - md.dim) * e,
                      translate: `0px ${((1 - e) * 7).toFixed(2)}px`,
                      scale: i === p.key ? `${1 + 0.06 * Math.sin(Math.PI * clamp01(k * 1.4))}` : "1",
                      color: isKey && k > 0 ? md.key : md.base,
                    }}
                  >
                    {tl.words[i].t}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
