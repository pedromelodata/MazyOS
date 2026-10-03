// Assinatura do fecho (dono K06): as linhas 34 a 47 do src/guia/Guia.tsx com os parâmetros de props.fecho.layout.
// ADR de 13/08: "Vai," + logo; o "aí" acende em coral na tônica, com um brilho curto atrás. Com o layout padrão
// (top 752, altura 140, gap 28, "Vai," em 106 px, logo de 590 px) a saída é idêntica à do guia.
import React from "react";
import { Img, staticFile } from "remotion";
import type { Estado, PropsKit } from "../nucleo/tipos";

const INK = "#1B1E24";

export const Fecho: React.FC<{ ui: Estado["ui"]; fecho: NonNullable<PropsKit["fecho"]> }> = ({ ui, fecho }) => {
  if (!(ui.assina > 0.01)) return null;
  const L = fecho.layout;
  const k = L.larguraLogo / 590; // as medidas do brilho e da caixa do logo são as do logo de 590 px
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.top, height: L.altura, display: "flex", justifyContent: "center", alignItems: "center", gap: L.gap,
      opacity: Math.min(1, ui.assina * 1.4), scale: `${0.86 + 0.14 * ui.assina}`, filter: `blur(${((1 - Math.min(1, ui.assina)) * 6).toFixed(2)}px)` }}>
      <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: L.tamanhoVai, lineHeight: 1, color: INK, letterSpacing: "-0.035em", translate: "0px 6px" }}>Vai,</span>
      <div style={{ position: "relative", width: L.larguraLogo, height: 116 * k }}>
        <div style={{ position: "absolute", right: -40 * k, top: -50 * k, width: 230 * k, height: 216 * k, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(242,100,60,0.38) 0%, rgba(242,100,60,0) 68%)",
          opacity: Math.max(0, Math.sin(Math.PI * Math.min(1, ui.ai * 1.6))) * 0.9 + ui.ai * 0.15 }} />
        <Img src={staticFile(L.logoBase)} style={{ position: "absolute", left: 0, top: 0, width: L.larguraLogo }} />
        <Img src={staticFile(L.logoAcesa)} style={{ position: "absolute", left: 0, top: 0, width: L.larguraLogo, opacity: ui.ai }} />
      </div>
    </div>
  );
};
