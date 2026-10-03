import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import "../lib/font";
import { C } from "./cores";
import { TELAS } from "./dados";
import { Palco } from "./cena/Palco";
import { Texto } from "./Texto";
import { LUZ_PADRAO, type Luz } from "./luz";

// Carrossel de 05/10 "Contabilidade tradicional e Legalizaí" (pilar 3). Quadro N = tela N.
// Cada tela é uma vitrine em dois painéis, com a mesma luz e a mesma câmera: à esquerda, objetos de argila fria
// (o passado bem cuidado, nunca o vilão); à direita, o iPhone com a tela do app no papel quente.
// O canvas desenha na densidade da página: no render com scale 2 sai em 2160 x 2700 e o pós reduz com Lanczos.
const DPR = typeof window !== "undefined" ? Math.min(2, Math.max(1, window.devicePixelRatio || 1)) : 1;

export const Carrossel: React.FC<{ luz?: Luz }> = ({ luz = LUZ_PADRAO }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(TELAS.length - 1, frame));
  const tela = TELAS[n];
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <ThreeCanvas
        width={1080}
        height={1350}
        dpr={DPR}
        shadows="variance"
        camera={{ manual: true, fov: 28, near: 0.02, far: 6, position: [0, 0.27, 0.91] }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <Palco key={n} tela={tela} luz={luz} />
      </ThreeCanvas>
      <Texto key={`t${n}`} tela={tela} />
    </AbsoluteFill>
  );
};
