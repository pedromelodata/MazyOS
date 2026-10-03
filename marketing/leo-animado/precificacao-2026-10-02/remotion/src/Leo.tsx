import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import "./lib/font";
import { C } from "./lib/tl";
import { Backdrop } from "./parts/Backdrop";
import { LeoLayer } from "./parts/LeoLayer";
import { Cards } from "./parts/Cards";
import { Captions } from "./parts/Captions";

// Reel do Léo: "3 sinais de que você já pode cobrar mais caro" (peça de 02/10, pilar 16)
export const Leo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop />
      <LeoLayer />
      <Cards />
      <Captions />
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
