// Batida "empurrar-tela" (coreografia.ts linhas 41 a 45): navegação do app, a tela nova entra pela direita
// (modo 1) e a câmera recua um pouco. `zera` entra no set do começo (o esqueleto para de brilhar antes de sair).
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, telaDe, trocaTela, vars, type Valores } from "./ajudantes";

export type ParamsEmpurrar = {
  alvo: string;
  t: Tempo;
  de: string;
  para: string;
  modo: number;
  dur: number;
  ease: string;
  zera: Record<string, number>;
  zeraEm: "inicio" | "fim";
  fim: number;
  camera: null | { desloc: number; para: Valores; dur: number; ease: string };
};

export const empurrarTela: Batida<ParamsEmpurrar> = {
  id: "empurrar-tela",
  camada: "tela",
  descricao: "Navegação: a tela nova entra pela direita, a antiga recua e escurece, e a câmera recua um pouco.",
  ancoras: ["inicio"],
  padrao: {
    alvo: "aparelho",
    t: 5.7,
    de: "inicio",
    para: "imposto",
    modo: 1,
    dur: 0.38,
    ease: "power3.inOut",
    zera: { calc: 0 },
    zeraEm: "inicio",
    fim: 0.39,
    camera: { desloc: 0.02, para: { z: 0.56, y: 0.006, ty: 0.004, tx: 0.008 }, dur: 0.7, ease: "power2.inOut" },
  },
  sons: {
    v2: [{ som: "pixabay-186577", em: "inicio", desloc: -0.04, ganhoDb: -30 }],
  },
  aplica(tl, st, p, ctx) {
    const tela = telaDe(st, p.alvo);
    const t0 = ctx.t(p.t);
    trocaTela(tl, tela, { de: p.de, para: p.para, modo: p.modo, dur: p.dur, ease: p.ease, fim: p.fim, zera: p.zera, zeraEm: p.zeraEm }, t0, ctx); // linhas 42 a 44
    if (p.camera) tl.to(st.cam, vars(p.camera.para, p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc }, t0)); // linha 45
    ctx.som(ancoras({ inicio: t0 }));
  },
};
