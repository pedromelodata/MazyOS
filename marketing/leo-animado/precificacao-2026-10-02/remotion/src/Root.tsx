import React from "react";
import { Composition } from "remotion";
import { Leo } from "./Leo";
import { Motion } from "./Motion";
import { Broll } from "./Broll";
import { CalendarioReview } from "./abertura/CalendarioReview";
import { Abertura } from "./abertura/Abertura";
import { TesteIphone } from "./guia/TesteIphone";
import { CelularSufoco } from "./sufoco/CelularSufoco";
import { CelularCinco } from "./sufoco/CelularCinco";
import { CincoMotivos, FPS_CINCO, QUADROS_CINCO } from "./cinco/CincoMotivos";
import { CelularCinco17 } from "./cinco/Celular17";
import { Guia } from "./guia/Guia";
import { FRAMES as GUIA_FRAMES } from "./guia/estado";
import timeline from "./data/timeline.json";
import timelineInst from "./data/timeline-inst.json";
import { KitMotion } from "./kit/render/KitMotion";
import { KitProvaModelo, PROPS_PROVA_PADRAO } from "./kit/render/KitProvaModelo";
import { PROPS_GUIA, calculaMetadadosKit } from "./kit/render/metadados";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LeoPrecificacao"
        component={Leo}
        durationInFrames={timeline.frames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MotionPrecificacao"
        component={Motion}
        durationInFrames={timelineInst.frames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BrollPrecificacao"
        component={Broll}
        durationInFrames={timelineInst.frames}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="AberturaMesLeo" component={Abertura} durationInFrames={540} fps={30} width={1080} height={1920} defaultProps={{ leo: true }} />
      <Composition id="AberturaMes" component={Abertura} durationInFrames={540} fps={30} width={1080} height={1920} defaultProps={{ leo: false }} />
      <Composition id="GuiaPronta" component={Guia} durationInFrames={GUIA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TesteIphone" component={TesteIphone} durationInFrames={1} fps={30} width={1080} height={1920}
        defaultProps={{ ry: -0.35, tela: "telas/tela-splash.png" }} />
      {/* reel de 09/10, versão 5: o celular 3D (fundo transparente) que entra no AE; 15,55 a 38,75 s do vídeo (v6), o dobro do tamanho no AE */}
      <Composition id="CelularSufoco" component={CelularSufoco} durationInFrames={2784} fps={120} width={1600} height={2400} />
      {/* reel "Cinco motivos pra ter CNPJ" (09/10): o celular 3D que entra no AE; 25,2 a 40,6 s do vídeo */}
      <Composition id="CelularCinco" component={CelularCinco} durationInFrames={1848} fps={120} width={1600} height={2400} />
      {/* reel "Cinco motivos pra ter CNPJ" (09/10), versão Remotion (v3): public-cinco */}
      {/* o iPhone 17 Pro Max do "Cinco motivos" (v6): 25,2 a 40,6 s do vídeo, sequência PNG com alfa (public-cinco) */}
      <Composition id="CelularCinco17" component={CelularCinco17} durationInFrames={1848} fps={120} width={1600} height={2400} />
      <Composition id="CincoMotivos" component={CincoMotivos} durationInFrames={QUADROS_CINCO} fps={FPS_CINCO} width={1080} height={1920} />
      <Composition
        id="CalendarioReview"
        component={CalendarioReview}
        durationInFrames={1}
        fps={30}
        width={1024}
        height={1024}
        defaultProps={{ azimuth: -35, elevation: 18, mode: "reference" as const }}
      />
      <Composition id="KitMotion" component={KitMotion} durationInFrames={540} fps={30} width={1080} height={1920} defaultProps={PROPS_GUIA} calculateMetadata={calculaMetadadosKit} />
      <Composition id="KitProvaModelo" component={KitProvaModelo} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={PROPS_PROVA_PADRAO} />
    </>
  );
};
