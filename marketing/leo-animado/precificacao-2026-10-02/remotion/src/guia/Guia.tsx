import React, { useRef, useState } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import "../lib/font";
import { useMasterTimeline } from "../abertura/useMasterTimeline";
import { AppleCaptions } from "../parts/AppleCaptions";
import { Cena3D } from "./Cena3D";
import { coreografia } from "./coreografia";
import { FPS, novoEstado, type Estado } from "./estado";
import narr from "./narracao.json";

const CORAL = "#F2643C";
const INK = "#1B1E24";

// Reel 14/10 "O app fazendo a guia do mês, sem site do governo", versão só motion (sem o Léo).
// 3D de verdade (iPhone e relógio GLB com a tela real do app), GSAP mestre avançado por quadro, legenda Apple.
export const Guia: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / FPS;
  const escopo = useRef<HTMLDivElement>(null);
  const [st] = useState<Estado>(() => novoEstado());
  const tl = useMasterTimeline((tl) => coreografia(tl, st), escopo);
  // seek um pouco depois do instante: no 0 exato os set() da posição 0 não aplicam (armadilha de 01/10)
  if (tl) tl.seek(t + 1e-4, false);
  const ui = st.ui;
  return (
    <AbsoluteFill ref={escopo} style={{ background: "#FAF8F5" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 30, near: 0.005, far: 20, position: [0, 0, 0.66] }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        {tl && <Cena3D st={st} t={t} />}
      </ThreeCanvas>
      {/* legenda Apple: frase apagada, palavra acende quando é dita, uma palavra coral por frase */}
      <AppleCaptions tl={narr} top={206} height={330} size={68} mode={() => "light"} />
      {/* assinatura (ADR 13/08): "Vai," + logo; o "aí" acende em coral na tônica, com um brilho curto atrás */}
      {ui.assina > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 752, height: 140, display: "flex", justifyContent: "center", alignItems: "center", gap: 28,
          opacity: Math.min(1, ui.assina * 1.4), scale: `${0.86 + 0.14 * ui.assina}`, filter: `blur(${((1 - Math.min(1, ui.assina)) * 6).toFixed(2)}px)` }}>
          <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 106, lineHeight: 1, color: INK, letterSpacing: "-0.035em", translate: "0px 6px" }}>Vai,</span>
          <div style={{ position: "relative", width: 590, height: 116 }}>
            <div style={{ position: "absolute", right: -40, top: -50, width: 230, height: 216, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(242,100,60,0.38) 0%, rgba(242,100,60,0) 68%)",
              opacity: Math.max(0, Math.sin(Math.PI * Math.min(1, ui.ai * 1.6))) * 0.9 + ui.ai * 0.15 }} />
            <Img src={staticFile("marca/logo-ai-tinta.svg")} style={{ position: "absolute", left: 0, top: 0, width: 590 }} />
            <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: 0, top: 0, width: 590, opacity: ui.ai }} />
          </div>
        </div>
      )}
      {ui.link > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", opacity: Math.min(1, ui.link * 1.3) }}>
          <div style={{ scale: `${0.7 + 0.3 * ui.link}`, background: CORAL, color: "#FFFFFF", borderRadius: 40, padding: "16px 38px", fontFamily: "Sora", fontWeight: 800, fontSize: 34, letterSpacing: "0.06em", boxShadow: "0 10px 26px rgba(221,78,39,0.28)" }}>
            LINK DA BIO
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
