// Pílula do link da bio (dono K06): as linhas 48 a 54 do src/guia/Guia.tsx com texto, cor, topo e tamanho de
// props.fecho.link. A cor vem das props: #F2643C só na cena do guia (o V4); nas peças novas, #DD4E27 (regra da
// marca), com o aviso do montaProps até o Pedro decidir.
import React from "react";
import type { Estado, PropsKit } from "../nucleo/tipos";

export const COR_LINK_PADRAO = "#DD4E27";

export const LinkBio: React.FC<{ ui: Estado["ui"]; link: NonNullable<PropsKit["fecho"]>["link"] }> = ({ ui, link }) => {
  if (!(ui.link > 0.01)) return null;
  const k = link.tamanho / 34; // padding medido no tamanho 34 do guia
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: link.top, display: "flex", justifyContent: "center", opacity: Math.min(1, ui.link * 1.3) }}>
      <div style={{ scale: `${0.7 + 0.3 * ui.link}`, background: link.cor || COR_LINK_PADRAO, color: "#FFFFFF", borderRadius: 40 * k, padding: `${16 * k}px ${38 * k}px`, fontFamily: "Sora", fontWeight: 800, fontSize: link.tamanho, letterSpacing: "0.06em", boxShadow: "0 10px 26px rgba(221,78,39,0.28)" }}>
        {link.texto}
      </div>
    </div>
  );
};
