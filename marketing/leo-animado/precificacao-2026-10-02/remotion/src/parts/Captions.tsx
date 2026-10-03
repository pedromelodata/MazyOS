import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, FPS, T, TL, clamp01, outCubic } from "../lib/tl";

// Legenda estilo Apple: a frase aparece inteira em tom apagado e cada palavra acende quando é dita.
const DIM = 0.2;

const Phrase: React.FC<{ p: (typeof TL.phrases)[number]; t: number }> = ({ p, t }) => {
  const tin = p.title ? -0.3 : p.s - 0.1;
  const tout = p.out - 0.26;
  if (t < tin || t > tout + 0.15) return null;
  const kin = outCubic((t - tin) / 0.18);
  const kout = t < tout ? 0 : outCubic((t - tout) / 0.14);
  const title = p.title;
  const size = title ? 62 : 74;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        width: 940,
        top: title ? 548 : 292,
        height: title ? 180 : 330,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: "-0.025em",
        color: C.ink,
        opacity: kin * (1 - kout),
        filter: `blur(${((1 - kin) * 9 + kout * 9).toFixed(2)}px)`,
        translate: `0px ${((1 - kin) * 18 - kout * 22).toFixed(2)}px`,
      }}
    >
      <div>
        {p.w.map((i) => {
          const k = title ? 1 : clamp01((t - (T(i) - 0.04)) / 0.2);
          const e = outCubic(k);
          const isKey = i === p.key;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                opacity: DIM + (1 - DIM) * e,
                translate: `0px ${((1 - e) * 7).toFixed(2)}px`,
                scale: isKey ? `${1 + 0.06 * Math.sin(Math.PI * clamp01(k * 1.4))}` : "1",
                color: (isKey || (title && i >= 7)) && k > 0 ? C.coral6 : C.ink,
              }}
            >
              {TL.words[i].t}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// título do gancho: "3 sinais", já na tela no quadro 0
const HookTitle: React.FC<{ t: number }> = ({ t }) => {
  const tout = T(10) - 0.26;
  if (t > tout + 0.2) return null;
  const kin = outCubic((t + 0.3) / 0.3);
  const kout = t < tout ? 0 : outCubic((t - tout) / 0.16);
  const k1 = clamp01((t - (T(1) - 0.04)) / 0.2);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: 300,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        opacity: kin * (1 - kout),
        filter: `blur(${(kout * 10).toFixed(2)}px)`,
        translate: `0px ${(-kout * 26).toFixed(2)}px`,
      }}
    >
      <span style={{ fontSize: 250, color: C.coral, display: "inline-block", scale: `${1 + 0.05 * Math.sin(Math.PI * clamp01(t / 0.5))}` }}>3</span>
      <span
        style={{
          fontSize: 170,
          color: C.ink,
          marginLeft: 28,
          display: "inline-block",
          scale: `${1 + 0.05 * Math.sin(Math.PI * k1)}`,
        }}
      >
        sinais
      </span>
    </div>
  );
};

export const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <HookTitle t={t} />
      {TL.phrases.map((p, k) => (
        <Phrase key={k} p={p} t={t} />
      ))}
    </AbsoluteFill>
  );
};
