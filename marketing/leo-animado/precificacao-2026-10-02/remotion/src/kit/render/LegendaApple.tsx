// Legenda estilo Apple do kit (dono K06): o src/parts/AppleCaptions.tsx com o fps do useVideoConfig (o original
// lê o fps da timeline do reel de 02/10) e as cores da marca. Com as mesmas props a saída é idêntica: frase
// inteira apagada, cada palavra acende quando é dita, uma palavra-chave em cor.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Narracao } from "../nucleo/tipos";

export type ModoLegenda = "light" | "dark" | "coral" | "video";

// cores da marca (as do src/lib/tl.ts)
const COR = { ink: "#1B1E24", coral: "#F2643C", coral6: "#DD4E27" };
const FONTE = "Sora";

// cor do texto, da palavra-chave, apagado e sombra por fundo
const MODOS: Record<ModoLegenda, { base: string; key: string; dim: number; shadow: string }> = {
  light: { base: COR.ink, key: COR.coral6, dim: 0.2, shadow: "none" },
  dark: { base: "#F4F1EC", key: COR.coral, dim: 0.3, shadow: "none" },
  coral: { base: "#FFFFFF", key: COR.ink, dim: 0.42, shadow: "none" },
  video: { base: "#FFFFFF", key: "#F47F58", dim: 0.38, shadow: "0 2px 18px rgba(0,0,0,0.45)" },
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const outCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export const LegendaApple: React.FC<{
  narracao: Pick<Narracao, "words" | "phrases">; top?: number; altura?: number; tamanho?: number; modo?: ModoLegenda;
  esquerda?: number; largura?: number; tituloAceso?: boolean; pula?: number[];
}> = ({ narracao: tl, top = 292, altura: height = 330, tamanho: size = 74, modo = "light", esquerda: left = 60, largura: width = 960, tituloAceso: titleLit = true, pula: skip = [] }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return (
    <AbsoluteFill>
      {tl.phrases.map((p, n) => {
        if (skip.indexOf(n) >= 0) return null;
        const tin = p.title ? -0.3 : p.s - 0.1;
        const tout = p.out - 0.26;
        if (t < tin || t > tout + 0.15) return null;
        const md = MODOS[modo] || MODOS.light;
        const kin = outCubic((t - tin) / 0.18);
        const kout = t < tout ? 0 : outCubic((t - tout) / 0.14);
        return (
          <div
            key={n}
            style={{
              position: "absolute", left, width, top, height,
              display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              fontFamily: FONTE, fontWeight: 700, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.025em",
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
