// Batida "objeto-sai-da-tela" (coreografia.ts linhas 47 a 49, 53, 55 e 56): o objeto (a guia de papel no guia)
// nasce na tela do aparelho e voa pro espaço sozinho (quem emite é o sistema; o único toque do vídeo é o do pagar),
// assenta de frente e sai pela esquerda. Aceita objeto do tipo folha, pilula ou comprovante.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto, sai, vars, type Valores } from "./ajudantes";

export const TIPOS_QUE_SAEM = ["folha", "pilula", "comprovante"];

export type ParamsObjetoSai = {
  alvo: string;
  objeto: string;
  t: Tempo;
  abre: null | { para: Valores; dur: number; ease: string };
  nasce: { desloc: number; pose: Record<string, number> };
  voa: null | { para: Valores; dur: number; ease: string };
  assenta: null | { t: Tempo; para: Valores; dur: number; ease: string };
  sai: null | { t: Tempo; para: Valores; dur: number; ease: string; esconde: number | null };
};

export const objetoSaiDaTela: Batida<ParamsObjetoSai> = {
  id: "objeto-sai-da-tela",
  camada: "3d",
  descricao: "O objeto (folha DAS, pílula ou comprovante) nasce na tela, voa pro espaço sozinho, assenta de frente e sai pela esquerda.",
  ancoras: ["inicio", "nasce", "assenta", "sai"],
  padrao: {
    alvo: "aparelho",
    objeto: "guia",
    t: 6.08,
    abre: { para: { x: -0.03, ry: 0.2 }, dur: 0.6, ease: "power2.inOut" },
    nasce: { desloc: 0.08, pose: { vis: 1, x: -0.03, y: -0.006, z: 0.01, rx: 0, ry: 0.2, rz: 0, s: 0.42 } },
    voa: { para: { x: 0.026, y: 0.012, z: 0.12, rx: -0.1, ry: -0.3, rz: 0.08, s: 0.97 }, dur: 0.66, ease: "expo.out" },
    assenta: { t: { palavra: 26, desloc: -0.05 }, para: { rx: -0.04, ry: -0.16, rz: 0.03 }, dur: 0.5, ease: "lgPousa" },
    sai: { t: 7.78, para: { x: -0.26, y: 0.07, rz: 0.7, ry: 0.4, s: 0.75 }, dur: 0.42, ease: "lgSai", esconde: 0.42 },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "nasce", desloc: -0.04, ganhoDb: -29, args: [0.45, 400, 7000] },
      { som: "sint-s_papel", em: "nasce", desloc: 0.02, ganhoDb: -30, args: [0.3] },
      { som: "sint-s_papel", em: "assenta", desloc: -0.01, ganhoDb: -33, args: [0.22] },
      { som: "sint-s_swish", em: "sai", desloc: -0.02, ganhoDb: -32, args: [0.3] },
      { som: "pixabay-405445", em: "sai", desloc: -0.02, ganhoDb: -29 },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const ob = objeto(st, ctx, p.objeto, TIPOS_QUE_SAEM);
    const t0 = ctx.t(p.t);
    if (p.abre) tl.to(ap, vars(p.abre.para, p.abre.dur, p.abre.ease), t0); // linha 47
    const tn = ctx.t({ desloc: p.nasce.desloc }, t0);
    tl.set(ob, { ...p.nasce.pose }, tn); // linha 48
    if (p.voa) tl.to(ob, vars(p.voa.para, p.voa.dur, p.voa.ease), tn); // linha 49
    let ta: number | undefined;
    if (p.assenta) {
      ta = ctx.t(p.assenta.t, t0);
      tl.to(ob, vars(p.assenta.para, p.assenta.dur, p.assenta.ease), ta); // linha 53
    }
    let ts: number | undefined;
    if (p.sai) {
      ts = ctx.t(p.sai.t, t0);
      sai(tl, ob, p.sai, ts, ctx); // linhas 55 e 56
    }
    ctx.som(ancoras({ inicio: t0, nasce: tn, assenta: ta, sai: ts }));
  },
};
