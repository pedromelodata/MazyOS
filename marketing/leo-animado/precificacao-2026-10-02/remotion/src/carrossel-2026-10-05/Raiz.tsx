import React from "react";
import { Composition } from "remotion";
import { Carrossel } from "./Carrossel";
import { TELAS } from "./dados";
import { LUZ_PADRAO } from "./luz";

// Composição "Carrossel": 1080 x 1350, um quadro por tela (quadro N = tela N, de 01-capa a 07-fecho).
// A luz vem nas props (padrão em luz.ts); o render de teste pode trocar por inputProps.
export const Raiz: React.FC = () => (
  <Composition id="Carrossel" component={Carrossel} width={1080} height={1350} fps={30} durationInFrames={TELAS.length} defaultProps={{ luz: LUZ_PADRAO }} />
);
