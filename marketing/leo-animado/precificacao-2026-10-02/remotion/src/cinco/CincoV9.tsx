// v9 do reel "Cinco motivos pra ter CNPJ" (13/10/2026), a pedido do Pedro: "construa toda a base pelo After effects e
// logo após isso refine com o Remotion o que precisa".
// A base 2D inteira sai do AE (cinco-motivos-ae/gera-v9.mjs -> monta-v9.jsx -> saida/base-ae-v9.mp4, com o motion blur
// nativo do AE): fundo, cenas, números do trilho, legenda com karaokê e pulinhos, fecho. Aqui entra só o que o AE
// desta máquina não faz: o iPhone 17 Pro Max 3D (a mesma sequência PNG da v8, cel17v7), com o deslize de saída no
// motion blur e a tremida dos impactos (na v8 ele tremia junto com a cena), e a luz coral atrás dele (o gradiente
// radial da v8, que acompanha o celular). O som entra no final.sh (copia), como na v8.
// Nesta máquina o OffthreadVideo não roda (o Smart App Control bloqueia o decodificador do Remotion), então o render
// é a composição CincoV9Celular (base=false): só o celular e a luz, com transparência (VP8 com alfa), e o ffmpeg cola
// por cima da base do AE (cinco-motivos-ae/junta-v9.sh). A CincoV9 com a base serve pra ver no Studio.
import React from "react";
import { AbsoluteFill, OffthreadVideo, getRemotionEnvironment, interpolate, staticFile, useCurrentFrame } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { Celular, D, FPS_CINCO, posCelular, tremida } from "./CincoMotivos";

const FPS = FPS_CINCO;

const LuzCelular: React.FC<{ t: number }> = ({ t }) => {
  const o = interpolate(t, [25.4 + D, 26.0 + D, 40.2 + D, 40.6 + D], [0, 0.32, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o < 0.001) return null;
  const cel = posCelular(t);
  return (
    <div
      style={{
        position: "absolute", left: cel.x - 520, top: cel.y - 700, width: 1040, height: 1400, opacity: o,
        background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(242,100,60,1) 0%, rgba(242,100,60,0.55) 35%, rgba(242,100,60,0) 72%)",
      }}
    />
  );
};

// dentro do motion blur: t é o tempo da amostra; fr é o quadro de verdade (a imagem do 3D é a mesma em todas as amostras
// e só o deslize borra)
const CelularPorCima: React.FC<{ fr: number }> = ({ fr }) => {
  const t = useCurrentFrame() / FPS;
  const { dx, dy } = tremida(t);
  return (
    <AbsoluteFill style={{ translate: `${dx.toFixed(2)}px ${dy.toFixed(2)}px` }}>
      <Celular t={t} fr={fr} />
    </AbsoluteFill>
  );
};

export const CincoV9: React.FC<{ base?: boolean }> = ({ base = true }) => {
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const { isRendering } = getRemotionEnvironment();
  const temCelular = t >= 25.2 + D - 0.1 && t <= 40.62 + D + 0.1;
  return (
    <AbsoluteFill style={base ? { backgroundColor: "#15171C" } : undefined}>
      {base && <OffthreadVideo src={staticFile("base-ae-v9.mp4")} muted />}
      <LuzCelular t={t} />
      {temCelular &&
        (isRendering ? (
          <HtmlInCanvasMotionBlur width={1080} height={1920} samples={10} shutterAngle={240}>
            <CelularPorCima fr={fr} />
          </HtmlInCanvasMotionBlur>
        ) : (
          <CelularPorCima fr={fr} />
        ))}
    </AbsoluteFill>
  );
};
