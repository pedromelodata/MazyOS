// Extensão "comum" do kit de motion (render). Contrato: KIT/DESENHO.md, seção 4.10.
// - objeto "palco-argila": o palco de argila genérico (palco/fabrica.ts); a mesma fábrica desenha os tipos de palco
//   que outras extensões registram (o "palco-tvl" da peça de 05/10 se liga a ela no render.tsx dela);
// - objeto "argila": um objeto de argila do carrossel de 05/10 solto na cena (objetos/argila.ts);
// - camada 2D "pilula-comenta": a pílula coral "Comenta aí" com o balão, a do fecho do carrossel.
// O render só LÊ o estado (st.canais, st.obj e st.cam): quem anima são as batidas (batidas.ts).
import React from "react";
import type { CamadaExtensao, RenderExtensao } from "../../render/tipos-render";
import { TIPO_PALCO, num } from "./palco/modelo";
import { fabricaPalco } from "./palco/fabrica";
import { fabricaArgila } from "./objetos/argila";

// ---------- camada 2D: pílula "Comenta aí" (a do fecho do carrossel) ----------
const txt = (x: unknown, p: string) => (typeof x === "string" && x ? x : p);

const Balao: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 30 30" style={{ display: "block" }}>
    <path
      d="M6.5 5h17A3.5 3.5 0 0 1 27 8.5v10a3.5 3.5 0 0 1 -3.5 3.5H14.2l-5.7 4.6V22H6.5A3.5 3.5 0 0 1 3 18.5v-10A3.5 3.5 0 0 1 6.5 5z"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.6}
      strokeLinejoin="round"
    />
  </svg>
);

const CamadaPilula: CamadaExtensao = ({ id, st, props }) => {
  const def = (props.camadas || []).filter((c) => c.id === id)[0];
  if (!def) return null;
  const c = st.canais[id] || {};
  const k = num(c.k, 0);
  if (k <= 0.001) return null;
  const tam = num(def.tamanho, 36);
  const z = tam / 34;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: num(def.top, 968), display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.3) }}>
      <div
        style={{
          scale: `${0.7 + 0.3 * k}`,
          display: "inline-flex",
          alignItems: "center",
          gap: 14 * z,
          background: txt(def.cor, "#DD4E27"),
          color: "#FFFFFF",
          borderRadius: 999,
          padding: `${20 * z}px ${40 * z}px`,
          fontFamily: "Sora",
          fontWeight: 800,
          fontSize: tam,
          lineHeight: 1,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 26px rgba(221,78,39,0.28)",
        }}
      >
        <Balao tam={Math.round(30 * z)} />
        <span>{txt(def.texto, "Comenta aí")}</span>
      </div>
    </div>
  );
};

export const render: RenderExtensao = {
  objetos: { [TIPO_PALCO]: fabricaPalco, argila: fabricaArgila },
  camadas: { "pilula-comenta": CamadaPilula },
};
