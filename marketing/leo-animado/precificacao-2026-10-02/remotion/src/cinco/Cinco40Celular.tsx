// Reel "Cinco motivos" de 40 s (13/10/2026), no estilo do pin "Motion inspiration - Frames": a base sai do After
// Effects pelo MCP (cinco-motivos-ae/manual-40s/gera-40s.mjs) e aqui entra só o iPhone 17 Pro Max 3D (a sequência
// cel17v7 da v9), com alfa, pra o ffmpeg colar por cima: tomada 19 ("Quatro: o app calcula.", fundo tinta, o celular
// chega girando com a tela do imposto) e tomada 22 ("é com a gente,", fundo papel, tela "Sua empresa nasceu").
// Os quadros das tomadas vêm do roteiro40.json; o celular fica à direita, longe do texto (corpo de x 618 a 900).
// Sem luz coral atrás: o degradê fraco virou anéis no alfa do VP8 (o fundo tinta já tem a luz radial do AE).
import React from "react";
import { AbsoluteFill, Img, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";

const cl = (x: number) => Math.min(1, Math.max(0, x));
const eBack = (x: number, s = 1.5) => { const y = x - 1; return 1 + (s + 1) * y * y * y + s * y * y; };
// [primeiro quadro da tomada, último + 1, primeiro índice da sequência, fundo]
// mais a câmera da tomada no AE (zoom de 8%, deriva e giro, em volta de 540, 960) e a saída na passagem pra próxima:
// [dx, dy, giro] da câmera e [x, y] da saída nos últimos 9 quadros
const TOMADAS: [number, number, number, "tinta" | "papel", [number, number, number], [number, number]][] = [
  [843, 892, 0, "tinta", [-14, -22, -0.8], [420, 0]],
  [984, 1007, 168, "papel", [14, -22, 0.8], [99, -99]],
];
const eIn = (x: number) => x * x * x;
const X = 760, Y = 900, ESC = 0.72;

// fr = quadro de verdade (a imagem é a mesma em todas as amostras do motion blur; só a escala da entrada borra)
const Celular: React.FC<{ fr: number }> = ({ fr }) => {
  const t = useCurrentFrame();
  const tom = TOMADAS.find(([a, b]) => fr >= a && fr < b);
  if (!tom) return null;
  const [a, b, i0, fundo, [cdx, cdy, cr], [sx, sy]] = tom;
  const i = Math.min(461, i0 + (fr - a));
  const k = fundo === "papel" ? 0.9 + 0.1 * eBack(cl((t - a) / 7)) : 1;
  const w = 800 * ESC * k, h = 1200 * ESC * k;
  const p = cl((t - a) / (b - a)), sai = eIn(cl((t - (b - 9)) / 5));
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 960px", transform: `translate(${cdx * p}px, ${cdy * p}px) rotate(${cr * p}deg) scale(${1 + 0.08 * p}) translate(${sx * sai}px, ${sy * sai}px)`, opacity: 1 - cl((t - (b - 8)) / 4) }}>
      <Img
        src={staticFile(`cel17v7/cel_${String(i).padStart(4, "0")}.png`)}
        style={{ position: "absolute", left: X - w / 2, top: Y - h / 2, width: w, height: h, filter: fundo === "papel" ? "drop-shadow(0px 28px 36px rgba(21,23,28,0.28))" : undefined }}
      />
    </AbsoluteFill>
  );
};

export const Cinco40Celular: React.FC = () => {
  const fr = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  return (
    <AbsoluteFill>
      {isRendering ? (
        <HtmlInCanvasMotionBlur width={1080} height={1920} samples={10} shutterAngle={200}>
          <Celular fr={fr} />
        </HtmlInCanvasMotionBlur>
      ) : (
        <Celular fr={fr} />
      )}
    </AbsoluteFill>
  );
};
