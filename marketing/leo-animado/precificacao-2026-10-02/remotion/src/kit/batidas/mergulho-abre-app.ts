// Batida "mergulho-abre-app" (coreografia.ts linhas 27 a 32): a câmera mergulha na tela (expo.inOut), o aparelho
// gira de leve e o app abre na tela pedida (troca com zoom, modo 0).
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto, telaDe, trocaTela, vars, type ParamsTroca, type Valores } from "./ajudantes";

export type ParamsMergulho = {
  alvo: string;
  t: Tempo;
  camera: null | { para: Valores; dur: number; ease: string; desloc?: number };
  giro: null | { para: Valores; dur: number; ease: string; desloc?: number };
  troca: ParamsTroca & { desloc: number };
};

export const mergulhoAbreApp: Batida<ParamsMergulho> = {
  id: "mergulho-abre-app",
  camada: "3d",
  descricao: "A câmera mergulha na tela, o aparelho gira de leve e o app abre (zoom de 0,92 com a tela nova acendendo).",
  ancoras: ["inicio", "troca"],
  padrao: {
    alvo: "aparelho",
    t: 3.6,
    camera: { para: { z: 0.35, y: 0.036, ty: 0.042 }, dur: 0.62, ease: "expo.inOut" },
    giro: { para: { ry: 0.1, rx: 0.05 }, dur: 0.7, ease: "power2.inOut" },
    troca: { de: "splash", para: "inicio", modo: 0, desloc: 0.08, dur: 0.45, ease: "power2.out", fim: 0.46 },
  },
  sons: {
    v2: [
      { som: "pixabay-405445", em: "inicio", desloc: -0.08, ganhoDb: -26 },
      { som: "pixabay-197886", em: "troca", desloc: 0.04, ganhoDb: -29 },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const tela = telaDe(st, p.alvo);
    const t0 = ctx.t(p.t);
    if (p.camera) tl.to(st.cam, vars(p.camera.para, p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc || 0 }, t0)); // linha 28
    if (p.giro) tl.to(ap, vars(p.giro.para, p.giro.dur, p.giro.ease), ctx.t({ desloc: p.giro.desloc || 0 }, t0)); // linha 29
    const tt = ctx.t({ desloc: p.troca.desloc }, t0);
    trocaTela(tl, tela, p.troca, tt, ctx); // linhas 30 a 32
    ctx.som(ancoras({ inicio: t0, troca: tt }));
  },
};
