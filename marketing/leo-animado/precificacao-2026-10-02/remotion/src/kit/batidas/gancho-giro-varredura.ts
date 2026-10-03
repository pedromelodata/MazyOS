// Batida "gancho-giro-varredura" (coreografia.ts linhas 14 a 17): o aparelho assenta com mola, a câmera
// aproxima devagar e uma varredura de luz passa pela lateral. Personalidade da marca: entrada com pouso (lgPousa),
// câmera sempre suave.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto, varredura, vars, type Valores } from "./ajudantes";

export type ParamsGancho = {
  alvo: string;
  t: Tempo;
  pose: null | { desloc: number; para: Valores; dur: number; ease: string };
  camera: null | { desloc: number; para: Valores; dur: number; ease: string };
  varredura: null | { desloc: number; dur: number; ease: string };
};

export const ganchoGiroVarredura: Batida<ParamsGancho> = {
  id: "gancho-giro-varredura",
  camada: "3d",
  descricao: "Abertura: o aparelho gira e assenta com mola, a câmera aproxima devagar e uma varredura de luz passa na lateral.",
  ancoras: ["inicio", "varredura"],
  padrao: {
    alvo: "aparelho",
    t: 0,
    pose: { desloc: 0.02, para: { ry: -0.06, rx: 0.04, rz: 0, y: -0.006 }, dur: 1.3, ease: "lgPousa" },
    camera: { desloc: 0, para: { z: 0.6 }, dur: 3.5, ease: "power1.inOut" },
    varredura: { desloc: 0.8, dur: 0.75, ease: "power2.inOut" },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "inicio", desloc: 0, ganhoDb: -32, args: [0.5, 400, 6000] },
      { som: "sint-s_brilho", em: "varredura", desloc: 0.02, ganhoDb: -38, args: [0.75] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const t0 = ctx.t(p.t);
    if (p.pose) tl.to(ap, vars(p.pose.para, p.pose.dur, p.pose.ease), ctx.t({ desloc: p.pose.desloc }, t0)); // linha 15
    if (p.camera) tl.to(st.cam, vars(p.camera.para, p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc }, t0)); // linha 16
    let tv: number | undefined;
    if (p.varredura) {
      tv = ctx.t({ desloc: p.varredura.desloc }, t0);
      varredura(tl, st.luz, p.varredura.dur, p.varredura.ease, tv); // linha 17
    }
    ctx.som(ancoras({ inicio: t0, varredura: tv }));
  },
};
