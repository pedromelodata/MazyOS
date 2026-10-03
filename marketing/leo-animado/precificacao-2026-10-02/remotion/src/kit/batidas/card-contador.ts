// Batida "card-contador" (coreografia.ts linhas 36 a 40): o card da tela acende em coral, o valor conta de 0 até o
// valor do extra "contador" da tela e o brilho de carregamento passa no esqueleto do botão. O valor é dado de
// exemplo e aparece nítido (decisão de 01/10); valor real de guia do MEI nunca aparece (F063).
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, telaDe } from "./ajudantes";

export type ParamsCardContador = {
  alvo: string;
  brilho: null | { t: Tempo; dur: number; ease: string };
  contador: null | { t: Tempo; dur: number; ease: string };
  varreduras: Array<{ t: Tempo; dur: number; ease?: string }>;
  apaga: null | { t: Tempo; dur: number; ease: string };
};

export const cardContador: Batida<ParamsCardContador> = {
  id: "card-contador",
  camada: "tela",
  descricao: "O card acende em coral, o valor conta até o número do extra \"contador\" e o brilho de carregamento passa no esqueleto do botão.",
  ancoras: ["brilho", "contador", "apaga"],
  padrao: {
    alvo: "aparelho",
    brilho: { t: { palavra: 16 }, dur: 0.25, ease: "power2.out" },
    contador: { t: { palavra: 17 }, dur: 0.9, ease: "power3.out" },
    varreduras: [
      { t: 4.45, dur: 0.55 },
      { t: 5.02, dur: 0.5 },
    ],
    apaga: { t: 5.5, dur: 0.3, ease: "power2.in" },
  },
  sons: {
    v2: [
      { som: "sint-s_chime", em: "brilho", desloc: 0.02, ganhoDb: -35, args: [1975.5, 0.6] },
      // composto: os tiques de "processando" de brilho+0,08 até o apaga (ganhos internos de -40 a -34)
      { som: "sint-s_processa", em: "brilho", desloc: 0.08, ganhoDb: 0, args: ["@brilho+0.08", "@apaga"] },
    ],
    enxuto: [
      { som: "sint-s_chime", em: "brilho", desloc: 0.02, ganhoDb: -35, args: [1975.5, 0.6] },
      { som: "sint-s_conta", em: "contador", desloc: 0, ganhoDb: 0, args: ["@contador", "$contadorDur", 16] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const tela = telaDe(st, p.alvo);
    let tb: number | undefined;
    let tc: number | undefined;
    let ta: number | undefined;
    if (p.brilho) {
      tb = ctx.t(p.brilho.t);
      tl.to(tela, { brilhoCard: 1, duration: p.brilho.dur, ease: p.brilho.ease }, tb); // linha 36
    }
    if (p.contador) {
      tc = ctx.t(p.contador.t, tb);
      tl.fromTo(tela, { conta: 0 }, { conta: 1, duration: p.contador.dur, ease: p.contador.ease, immediateRender: false }, tc); // linha 37
    }
    const base = tb !== undefined ? tb : tc;
    for (const v of p.varreduras || []) {
      const tv = ctx.t(v.t, base);
      tl.fromTo(tela, { calc: 0 }, { calc: 1, duration: v.dur, ease: v.ease || "none", immediateRender: false }, tv); // linhas 38 e 39
    }
    if (p.apaga) {
      ta = ctx.t(p.apaga.t, base);
      tl.to(tela, { brilhoCard: 0, duration: p.apaga.dur, ease: p.apaga.ease }, ta); // linha 40
    }
    ctx.som(ancoras({ brilho: tb, contador: tc, apaga: ta }), { contadorDur: p.contador ? p.contador.dur : 0 });
  },
};
