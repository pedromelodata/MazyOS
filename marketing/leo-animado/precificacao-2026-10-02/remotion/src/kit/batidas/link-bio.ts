// Batida "link-bio" (coreografia.ts linhas 122 e 124): a pílula do link da bio entra com overshoot e sai junto
// com a assinatura. Texto e cor vêm de fecho.link das props (peças novas: #DD4E27; o guia: #F2643C).
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras } from "./ajudantes";

export type ParamsLink = {
  t: Tempo;
  dur: number;
  ease: string;
  sai: null | { t: Tempo; dur: number; ease: string };
};

export const linkBio: Batida<ParamsLink> = {
  id: "link-bio",
  camada: "fecho",
  descricao: "A pílula do link da bio entra com overshoot e sai junto com a assinatura.",
  ancoras: ["inicio"],
  padrao: {
    t: { fecho: 0.3 },
    dur: 0.45,
    ease: "lgEntra",
    sai: { t: { fecho: 1.95 }, dur: 0.3, ease: "lgSai" },
  },
  sons: {
    v2: [{ som: "pixabay-316482", em: "inicio", desloc: 0, ganhoDb: -28 }],
  },
  aplica(tl, st, p, ctx) {
    const t0 = ctx.t(p.t);
    tl.to(st.ui, { link: 1, duration: p.dur, ease: p.ease }, t0); // linha 122
    if (p.sai) tl.to(st.ui, { link: 0, duration: p.sai.dur, ease: p.sai.ease }, ctx.t(p.sai.t, t0)); // linha 124 (a parte do link)
    if (!ctx.props.fecho) ctx.avisa("a cena não tem fecho (fecho null): o link da bio não aparece no render");
    ctx.som(ancoras({ inicio: t0 }));
  },
};
