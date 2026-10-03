// Batida "nao-de-cabeca" (coreografia.ts linhas 18 a 24): o aparelho balança a cabeça, um "não" de
// personagem, em keyframes no eixo escolhido (valores absolutos). No guia cai no "sem entrar no site do governo".
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto } from "./ajudantes";

export type ParamsNaoDeCabeca = {
  alvo: string;
  t: Tempo;
  eixo: "ry" | "rx" | "rz";
  chaves: Array<[number, number, string?]>; // [valor absoluto, duração, ease]
};

export const naoDeCabeca: Batida<ParamsNaoDeCabeca> = {
  id: "nao-de-cabeca",
  camada: "3d",
  descricao: "O aparelho balança a cabeça (um \"não\" de personagem): quatro chaves no eixo, a última pousando com mola.",
  ancoras: ["inicio"],
  padrao: {
    alvo: "aparelho",
    t: { palavra: 9, desloc: -0.02 },
    eixo: "ry",
    chaves: [
      [-0.17, 0.13, "power2.out"],
      [0.07, 0.17, "power2.inOut"],
      [-0.12, 0.15, "power2.inOut"],
      [-0.04, 0.3, "lgPousa"],
    ],
  },
  sons: {
    v2: [
      { som: "sint-s_swish", em: "inicio", desloc: 0, ganhoDb: -37, args: [0.13] },
      { som: "sint-s_swish", em: "inicio", desloc: 0.16, ganhoDb: -38, args: [0.13] },
      { som: "sint-s_swish", em: "inicio", desloc: 0.32, ganhoDb: -39, args: [0.13] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const t0 = ctx.t(p.t);
    const kf = p.chaves.map((c) => {
      const k: Record<string, unknown> = {};
      k[p.eixo] = c[0];
      k.duration = c[1];
      if (c[2] !== undefined) k.ease = c[2];
      return k as gsap.TweenVars;
    });
    tl.to(ap, { keyframes: kf }, t0); // linhas 19 a 24
    ctx.som(ancoras({ inicio: t0 }));
  },
};
