// Composição KitMotion (dono K06; contrato: KIT/DESENHO.md, seções 1, 4.4 e 4.10): como o src/guia/Guia.tsx,
// dirigida pelas props. Fundo #FAF8F5; ThreeCanvas com a câmera das props (near 0,005, far 20, antialias e
// preserveDrawingBuffer); timeline mestre GSAP avançada por quadro com seek(t + 1e-4); a cena 3D por dados, a
// legenda Apple, o fecho, o link da bio e, por cima, as camadas 2D das extensões (pelo ext.ts).
// Com as props do guia (props-guia.json) o quadro sai igual ao da composição GuiaPronta.
import React, { useRef, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import "../../lib/font";
import { novoEstado } from "../nucleo/estado";
import type { Estado, PropsKit } from "../nucleo/tipos";
import { Cena3DKit } from "./Cena3DKit";
import { camadasDeRender, confereExtensoes, fabricasDeObjetos, registroDeBatidas } from "./ext";
import { Fecho } from "./Fecho";
import { LegendaApple } from "./LegendaApple";
import { LinkBio } from "./LinkBio";
import { useTimelineKit } from "./useTimelineKit";

export const KitMotion: React.FC<PropsKit> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const escopo = useRef<HTMLDivElement>(null);
  const [reg] = useState(() => {
    confereExtensoes({
      batidas: (props.batidas || []).map((b) => b.id),
      camadas: (props.camadas || []).map((c) => c.tipo),
      objetos: (props.objetos || []).map((o) => o.tipo),
    });
    return { batidas: registroDeBatidas(), fabricas: fabricasDeObjetos(), camadas: camadasDeRender() };
  });
  const [st] = useState<Estado>(() => novoEstado(props));
  const tl = useTimelineKit(st, props, reg.batidas);
  // seek um pouco depois do instante: no 0 exato os set() da posição 0 não aplicam (armadilha de 01/10)
  if (tl) tl.seek(t + 1e-4, false);
  const ui = st.ui;
  const cam = props.camera;
  const leg = props.legenda;
  const canvas3d = (
    <ThreeCanvas width={width} height={height} camera={{ fov: cam.fov, near: 0.005, far: 20, position: [cam.x, cam.y, cam.z] }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      {tl && <Cena3DKit st={st} t={t} props={props} fabricas={reg.fabricas} />}
    </ThreeCanvas>
  );
  // desfoque de movimento da troca de lado (batida troca-lado, extensão comum): horizontal, só no 3D, com o desvio
  // do canal camera.borrao. A embalagem existe só nas cenas com a batida (fixa na composição: trocar a árvore
  // remontaria o canvas); sem ela, o quadro sai como antes.
  const comBorrao = (props.batidas || []).some((b) => b.id === "troca-lado");
  const borrao = comBorrao ? Math.max(0, Number((st.canais.camera || {}).borrao) || 0) : 0;
  return (
    <AbsoluteFill ref={escopo} style={{ background: "#FAF8F5" }}>
      {comBorrao ? (
        <AbsoluteFill style={{ filter: borrao > 0.05 ? "url(#kitBorraoX)" : "none" }}>
          {canvas3d}
          <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
            <filter id="kitBorraoX" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${borrao.toFixed(2)} 0`} edgeMode="duplicate" />
            </filter>
          </svg>
        </AbsoluteFill>
      ) : (
        canvas3d
      )}
      {/* legenda Apple: frase apagada, palavra acende quando é dita, uma palavra coral por frase */}
      <LegendaApple narracao={props.narracao} top={leg.top} altura={leg.altura} tamanho={leg.tamanho} modo={leg.modo} esquerda={leg.esquerda} largura={leg.largura} />
      {/* assinatura (ADR 13/08): "Vai," + logo; o "aí" acende em coral na tônica */}
      {props.fecho && <Fecho ui={ui} fecho={props.fecho} />}
      {props.fecho && <LinkBio ui={ui} link={props.fecho.link} />}
      {(props.camadas || []).map((c) => {
        const Camada = reg.camadas[c.tipo];
        if (!Camada) throw new Error(`camada "${c.id}" de tipo "${c.tipo}" sem componente (nenhuma extensão ligada desenha esse tipo)`);
        return <Camada key={c.id} id={c.id} st={st} props={props} t={t} />;
      })}
    </AbsoluteFill>
  );
};
