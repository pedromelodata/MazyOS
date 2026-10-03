// Batida "toque-botao" (coreografia.ts linhas 84 e 88 a 93): no "só" o botão pulsa uma vez; no "pagar" o
// círculo de toque encosta, o aparelho afunda 3 mm e volta com mola, e logo depois o botão mostra o retorno real
// do app (o `retorno` do extra "botao" da tela; no guia, "Código copiado"), no coral do botão. Nada de verde,
// "pago" ou confete: o app não confirma pagamento. O rótulo volta sozinho depois.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, keyframes, objeto, telaDe } from "./ajudantes";

export type ParamsToque = {
  alvo: string;
  palavra: number; // toque = W(palavra); so = W(palavra - 1)
  t?: Tempo; // opcional: troca o instante do toque
  so?: Tempo; // opcional: troca a âncora "so"
  pulso: null | { t: Tempo; dur: number };
  afunda: null | { desloc: number; chaves: Array<Record<string, number | string>> };
  toque: { desloc: number; dur: number };
  verif: { desloc: number; dur: number };
  anel: null | { desloc: number; dur: number };
  volta: null | { t: Tempo; dur: number; ease: string };
};

export const toqueBotao: Batida<ParamsToque> = {
  id: "toque-botao",
  camada: "tela",
  descricao: "Toque no botão da tela: pulso no \"só\", círculo de toque e aperto no \"pagar\", o aparelho afunda e volta com mola, e o botão mostra o retorno do app.",
  ancoras: ["so", "toque"],
  padrao: {
    alvo: "aparelho",
    palavra: 37,
    pulso: { t: 10.02, dur: 0.18 },
    afunda: {
      desloc: -0.05,
      chaves: [
        { z: -0.003, rx: 0.055, dur: 0.06, ease: "power2.out" },
        { z: 0, rx: 0.04, dur: 0.25, ease: "lgPousa" },
      ],
    },
    toque: { desloc: -0.1, dur: 0.55 },
    verif: { desloc: 0.08, dur: 0.55 },
    anel: { desloc: 0.2, dur: 0.6 },
    volta: { t: 12.1, dur: 0.3, ease: "power2.inOut" },
  },
  sons: {
    v2: [
      { som: "sint-s_tick", em: "so", desloc: 0, ganhoDb: -38, args: [2900] },
      { som: "mixkit-1109", em: "toque", desloc: -0.01, ganhoDb: -22 },
      { som: "mixkit-2867", em: "toque", desloc: 0.12, ganhoDb: -26, transpor: "trilha" },
    ],
    enxuto: [
      { som: "mixkit-2568", em: "toque", desloc: 0, ganhoDb: -22 },
      { som: "mixkit-2867", em: "toque", desloc: 0.056, ganhoDb: -26, transpor: "trilha" },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const tela = telaDe(st, p.alvo);
    if (p.t === undefined && !(typeof p.palavra === "number" && p.palavra >= 1)) {
      throw new Error(`toque-botao precisa de "palavra" >= 1 (o "só" é a palavra anterior) ou de "t"`);
    }
    const tt = p.t !== undefined ? ctx.t(p.t) : ctx.W(p.palavra);
    const so = p.so !== undefined ? ctx.t(p.so, tt) : p.t !== undefined ? undefined : ctx.W(p.palavra - 1);
    ctx.t(tt); // confere se o toque cai dentro do vídeo
    if (p.afunda) tl.to(ap, { keyframes: keyframes(p.afunda.chaves) }, ctx.t({ desloc: p.afunda.desloc }, tt)); // linha 84
    if (p.pulso) {
      tl.fromTo(tela, { pulso: 0 }, { pulso: 1, duration: p.pulso.dur, ease: "none", immediateRender: false }, ctx.t(p.pulso.t, tt)); // linha 88
    }
    tl.fromTo(tela, { toqueBotao: 0 }, { toqueBotao: 1, duration: p.toque.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.toque.desloc }, tt)); // linha 89
    tl.fromTo(tela, { verif: 0 }, { verif: 1, duration: p.verif.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.verif.desloc }, tt)); // linha 90
    if (p.anel) {
      tl.fromTo(tela, { anel: 0 }, { anel: 1, duration: p.anel.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.anel.desloc }, tt)); // linha 91
    }
    if (p.volta) tl.to(tela, { verif: 0, duration: p.volta.dur, ease: p.volta.ease }, ctx.t(p.volta.t, tt)); // linha 93
    if (!temBotao(ctx.props.telas)) ctx.avisa('nenhuma tela da cena tem extra "botao": o toque não vai ter rótulo nem retorno');
    ctx.som(ancoras({ so, toque: tt }));
  },
};

function temBotao(telas: Record<string, { extras: Array<{ tipo: string }> }>): boolean {
  for (const k of Object.keys(telas || {})) for (const e of telas[k].extras || []) if (e.tipo === "botao") return true;
  return false;
}
