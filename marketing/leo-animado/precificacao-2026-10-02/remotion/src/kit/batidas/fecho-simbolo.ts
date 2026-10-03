// Batida "fecho-simbolo" (coreografia.ts linhas 106 a 109, 117 a 121, 123 e 124): o app fecha no splash, o
// aparelho encolhe até o lugar do símbolo do logo (corte casado: a tela coral vira o quadradinho do símbolo) e
// some; entra "Vai," + logo, o "aí" acende quando é falado e a assinatura sai. Publica "simbolo" (onde o
// aparelho sumiu) pra volta-loop nascer dali.
// alvoMundo null: desprojeta o ponto do símbolo (alvoPx) no plano z = 0 com a câmera do estado no instante do
// encolhe (valor por função no GSAP, avaliado quando o tween inicia). O guia usa o fixo [-0.021, 0.019].
import type { Batida, Tempo } from "../nucleo/tipos";
import { desprojeta } from "../nucleo/projecao";
import { ancoras, objeto, telaDe, trocaTela, vars, type ParamsTroca, type Valores } from "./ajudantes";

export type PontoSimbolo = { x: number; y: number };
/** o que a fecho-simbolo publica em "simbolo": o ponto fixo ou uma função que calcula (e guarda) na hora */
export type SimboloPublicado = PontoSimbolo | (() => PontoSimbolo);

export type ParamsFecho = {
  alvo: string;
  appFecha: null | (ParamsTroca & { t: Tempo });
  pose: null | { para: Valores; dur: number; ease: string };
  encolhe: { t: Tempo; alvoMundo: [number, number] | null; alvoPx: [number, number]; s: number; dur: number; ease: string; esconde: number | null };
  assina: null | { t: Tempo; dur: number; ease: string };
  ai: null | { t: Tempo; dur: number; ease: string };
  sai: null | { t: Tempo; dur: number; ease: string };
};

export const fechoSimbolo: Batida<ParamsFecho> = {
  id: "fecho-simbolo",
  camada: "fecho",
  descricao: "Fecho: o app fecha no splash, o aparelho encolhe até o símbolo do logo e some, entra \"Vai,\" + logo e o \"aí\" acende quando é falado.",
  ancoras: ["appFecha", "encolhe", "assina", "ai", "sai"],
  padrao: {
    alvo: "aparelho",
    appFecha: { t: 13.45, de: "inicioPagar", para: "splash", modo: 0, dur: 0.45, ease: "power2.out", fim: 0.47, zera: { verif: 0, toqueBotao: 0, anel: 0 }, zeraEm: "fim" },
    pose: { para: { y: 0.008, s: 0.78, ry: 0 }, dur: 0.7, ease: "lgPousa" },
    encolhe: { t: { fecho: -0.4 }, alvoMundo: [-0.021, 0.019], alvoPx: [410, 818], s: 0.12, dur: 0.4, ease: "power3.in", esconde: 0.4 },
    assina: { t: { fecho: -0.06 }, dur: 0.42, ease: "lgEntra" },
    ai: { t: { fecho: "aiAcende" }, dur: 0.12, ease: "power2.out" },
    sai: { t: { fecho: 1.95 }, dur: 0.3, ease: "lgSai" },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "appFecha", desloc: 0, ganhoDb: -32, args: [0.45, 400, 6500] },
      { som: "sint-s_whoosh", em: "encolhe", desloc: -0.02, ganhoDb: -31, args: [0.45, 400, 7000], inverte: true },
      { som: "sint-s_pop", em: "assina", desloc: 0.03, ganhoDb: -29, args: [900, 420, 0.1, 34] },
      { som: "sint-s_chime", em: "ai", desloc: 0.02, ganhoDb: -33, args: [1567.98, 0.9] },
      { som: "sint-s_chime", em: "ai", desloc: 0.06, ganhoDb: -39, args: [2093.0, 0.7] },
      { som: "sint-s_swish", em: "sai", desloc: 0, ganhoDb: -33, args: [0.3] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    let ta: number | undefined;
    if (p.appFecha) {
      const tela = telaDe(st, p.alvo);
      ta = ctx.t(p.appFecha.t);
      trocaTela(tl, tela, p.appFecha, ta, ctx); // linhas 106 a 108
      if (p.pose) tl.to(ap, vars(p.pose.para, p.pose.dur, p.pose.ease), ta); // linha 109
    }
    const te = ctx.t(p.encolhe.t, ta);
    // ponto do símbolo do logo no mundo
    let simbolo: SimboloPublicado;
    const am = p.encolhe.alvoMundo;
    if (am) {
      simbolo = { x: am[0], y: am[1] };
    } else {
      let guardado: PontoSimbolo | null = null;
      const px = p.encolhe.alvoPx;
      const props = ctx.props;
      simbolo = () => {
        if (!guardado) {
          const d = desprojeta(px[0], px[1], st.cam, 0, { largura: props.largura, altura: props.altura });
          guardado = { x: d.x, y: d.y };
        }
        return guardado;
      };
    }
    const fx = simbolo;
    const enc =
      typeof fx === "function"
        ? { x: () => fx().x, y: () => fx().y, s: p.encolhe.s, rx: 0, ry: 0, rz: 0 }
        : { x: fx.x, y: fx.y, s: p.encolhe.s, rx: 0, ry: 0, rz: 0 };
    tl.to(ap, vars(enc, p.encolhe.dur, p.encolhe.ease), te); // linha 119
    if (p.encolhe.esconde !== null && p.encolhe.esconde !== undefined) tl.set(ap, { vis: 0 }, ctx.t({ desloc: p.encolhe.esconde }, te)); // linha 120
    ctx.publica("simbolo", simbolo);
    let tas: number | undefined;
    if (p.assina) {
      tas = ctx.t(p.assina.t, te);
      tl.to(st.ui, { assina: 1, duration: p.assina.dur, ease: p.assina.ease }, tas); // linha 121
    }
    let tai: number | undefined;
    if (p.ai) {
      tai = ctx.t(p.ai.t, te);
      tl.to(st.ui, { ai: 1, duration: p.ai.dur, ease: p.ai.ease }, tai); // linha 123
    }
    let tsa: number | undefined;
    if (p.sai) {
      tsa = ctx.t(p.sai.t, te);
      tl.to(st.ui, { assina: 0, duration: p.sai.dur, ease: p.sai.ease }, tsa); // linha 124 (a parte da assinatura)
    }
    ctx.som(ancoras({ appFecha: ta, encolhe: te, assina: tas, ai: tai, sai: tsa }));
  },
};
