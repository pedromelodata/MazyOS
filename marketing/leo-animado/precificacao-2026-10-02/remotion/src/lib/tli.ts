import timeline from "../data/timeline-inst.json";

// linha do tempo das versões sem o Léo (narração institucional "a gente fica de olho")
export const TI = timeline;
export const M = timeline.marks as Record<string, number>;
export const TIw = (i: number) => timeline.words[i].s;

/** janelas de cena: [início, fim) em segundos */
export const SCENES = [
  { id: "hook", t0: 0, t1: M.um - 0.12 },
  { id: "s1", t0: M.um - 0.12, t1: M.dois - 0.12 },
  { id: "s2", t0: M.dois - 0.12, t1: M.tres2 - 0.12 },
  { id: "s3", t0: M.tres2 - 0.12, t1: M.bateu - 0.12 },
  { id: "s4", t0: M.bateu - 0.12, t1: M.cobrar - 0.12 },
  { id: "s5", t0: M.cobrar - 0.12, t1: M.app - 0.3 },
  { id: "s6", t0: M.app - 0.3, t1: M.comenta - 0.12 },
  { id: "cta", t0: M.comenta - 0.12, t1: timeline.dur + 1 },
];
export const PUNCH_I = [M.caro, M.nunca, M.cheia, M.mesmo, M.doisq, M.reajustar, M.cresceu, M.olho, M.n81, M.tem];
