// Batida "relogio-notificacao" (coreografia.ts linhas 57 a 62, 68 e 69): o aparelho abre espaço, o relógio
// entra pela direita com pouso de mola, a notificação sobe no mostrador, o relógio vibra e sai acelerando.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, entra, objeto, sai, vars, vibra, type Valores } from "./ajudantes";

export type ParamsRelogio = {
  alvo: string;
  relogio: string;
  t: Tempo;
  abre: null | { desloc: number; para: Valores; dur: number; ease: string };
  entra: { de: Record<string, number> | null; para: Valores; dur: number; ease: string };
  camera: null | { para: Valores; dur: number; ease: string; desloc?: number };
  notif: null | { t: Tempo; dur: number; ease?: string };
  vibra: null | { t: Tempo; pulsos: Array<Array<number | string>> };
  sai: null | { t: Tempo; para: Valores; dur: number; ease: string; esconde: number | null };
};

export const relogioNotificacao: Batida<ParamsRelogio> = {
  id: "relogio-notificacao",
  camada: "3d",
  descricao: "O relógio entra pela direita com o aviso do app no mostrador, vibra duas vezes e sai; o aparelho abre espaço.",
  ancoras: ["inicio", "notif", "vibra", "sai"],
  padrao: {
    alvo: "aparelho",
    relogio: "relogio",
    t: 7.8,
    abre: { desloc: -0.08, para: { x: -0.032, z: -0.03, ry: 0.42 }, dur: 0.6, ease: "power2.inOut" },
    entra: {
      de: { vis: 1, x: 0.22, y: -0.07, z: 0.13, rx: -0.15, ry: -0.9, rz: -0.5, s: 1.15 },
      para: { x: 0.036, y: -0.032, z: 0.14, ry: -0.3, rz: 0, rx: -0.05 },
      dur: 0.55,
      ease: "lgPousa",
    },
    camera: { para: { tx: 0.006, z: 0.6 }, dur: 0.6, ease: "power2.inOut" },
    notif: { t: 8.02, dur: 0.42 },
    vibra: { t: 8.04, pulsos: [[1, 0.04], [0, 0.12], [1, 0.04], [0, 0.14]] },
    sai: { t: 8.95, para: { x: 0.25, y: -0.11, rz: 0.6 }, dur: 0.38, ease: "lgSai", esconde: 0.39 },
  },
  sons: {
    v2: [
      { som: "sint-s_vibra", em: "vibra", desloc: 0, ganhoDb: -25, args: [0.16] },
      { som: "sint-s_vibra", em: "vibra", desloc: 0.18, ganhoDb: -26, args: [0.18] },
      { som: "pixabay-570438", em: "notif", desloc: 0.05, ganhoDb: -25 },
      { som: "sint-s_swish", em: "sai", desloc: -0.02, ganhoDb: -32, args: [0.28] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const rel = objeto(st, ctx, p.relogio, ["relogio"]);
    const most = st.mostradores[p.relogio];
    const t0 = ctx.t(p.t);
    if (p.abre) tl.to(ap, vars(p.abre.para, p.abre.dur, p.abre.ease), ctx.t({ desloc: p.abre.desloc }, t0)); // linha 57
    entra(tl, rel, p.entra.de, p.entra, t0); // linhas 58 e 59
    if (p.camera) tl.to(st.cam, vars(p.camera.para, p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc || 0 }, t0)); // linha 60
    let tn: number | undefined;
    if (p.notif) {
      tn = ctx.t(p.notif.t, t0);
      tl.to(most, { notif: 1, duration: p.notif.dur, ease: p.notif.ease || "none" }, tn); // linha 61
    }
    let tv: number | undefined;
    if (p.vibra) {
      tv = ctx.t(p.vibra.t, t0);
      vibra(tl, rel, p.vibra.pulsos, tv); // linha 62
    }
    let ts: number | undefined;
    if (p.sai) {
      ts = ctx.t(p.sai.t, t0);
      sai(tl, rel, p.sai, ts, ctx); // linhas 68 e 69
    }
    ctx.som(ancoras({ inicio: t0, notif: tn, vibra: tv, sai: ts }));
  },
};
