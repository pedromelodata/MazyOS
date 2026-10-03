// Batida "recuo-camera" (coreografia.ts linhas 97 a 104): a câmera recua primeiro (x, tx, tz, fov da câmera
// inicial e z próprio) e só depois baixa a mira (y e ty da câmera inicial), pra o topo do aparelho não subir por
// cima da legenda; varredura de luz numa palavra e giro lento do aparelho mostrando a tela.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto, resolveCam0, varredura, vars, type Valores } from "./ajudantes";

export type ParamsRecuo = {
  alvo: string;
  t: Tempo;
  pose: null | { para: Valores; dur: number; ease: string; desloc?: number };
  camera: null | { para: Valores | "cam0"; dur: number; ease: string; desloc?: number }; // "cam0" = câmera inicial da cena
  mira: null | { desloc: number; para: Valores | "cam0"; dur: number; ease: string };
  varredura: null | { t: Tempo; dur: number; ease: string };
  giroLento: null | { t: Tempo; para: Valores; dur: number; ease: string };
};

export const recuoCamera: Batida<ParamsRecuo> = {
  id: "recuo-camera",
  camada: "3d",
  descricao: "A câmera recua e depois baixa a mira, uma varredura de luz passa e o aparelho gira devagar mostrando a tela.",
  ancoras: ["inicio", "varredura"],
  padrao: {
    alvo: "aparelho",
    t: 10.95,
    pose: { para: { rx: 0.05, y: -0.004, x: 0, ry: -0.3 }, dur: 0.8, ease: "power3.inOut" },
    camera: { para: { x: "cam0", tx: "cam0", tz: "cam0", fov: "cam0", z: 0.58 }, dur: 0.85, ease: "power2.inOut" },
    mira: { desloc: 0.3, para: { y: "cam0", ty: "cam0" }, dur: 0.75, ease: "power2.inOut" },
    varredura: { t: { palavra: 42, desloc: -0.1 }, dur: 0.7, ease: "power2.inOut" },
    giroLento: { t: 11.8, para: { ry: 0.22 }, dur: 1.6, ease: "sine.inOut" },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "inicio", desloc: 0, ganhoDb: -33, args: [0.55, 350, 6000] },
      { som: "sint-s_brilho", em: "varredura", desloc: 0.02, ganhoDb: -36, args: [0.7] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const cam0 = ctx.props.camera;
    const t0 = ctx.t(p.t);
    if (p.pose) tl.to(ap, vars(p.pose.para, p.pose.dur, p.pose.ease), ctx.t({ desloc: p.pose.desloc || 0 }, t0)); // linha 97
    if (p.camera) tl.to(st.cam, vars(resolveCam0(p.camera.para, cam0), p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc || 0 }, t0)); // linha 100
    if (p.mira) tl.to(st.cam, vars(resolveCam0(p.mira.para, cam0), p.mira.dur, p.mira.ease), ctx.t({ desloc: p.mira.desloc }, t0)); // linha 101
    let tv: number | undefined;
    if (p.varredura) {
      tv = ctx.t(p.varredura.t, t0);
      varredura(tl, st.luz, p.varredura.dur, p.varredura.ease, tv); // linha 103
    }
    if (p.giroLento) tl.to(ap, vars(p.giroLento.para, p.giroLento.dur, p.giroLento.ease), ctx.t(p.giroLento.t, t0)); // linha 104
    ctx.som(ancoras({ inicio: t0, varredura: tv }));
  },
};
