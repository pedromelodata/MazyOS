// Batida "volta-loop" (coreografia.ts linhas 125 a 127): o aparelho nasce de volta do símbolo do logo (o ponto
// publicado pela fecho-simbolo) e volta pra pose do quadro 0, com a câmera voltando pra câmera inicial: o último
// quadro emenda no primeiro.
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, objeto, resolveCam0, resolvePose0, vars, type Valores } from "./ajudantes";
import type { SimboloPublicado } from "./fecho-simbolo";

export type ParamsVolta = {
  alvo: string;
  t: Tempo;
  nasce: null | { de: "simbolo" | [number, number]; s: number };
  pose: { para: Valores | "pose0"; s: number; desloc: number; dur: number; ease: string };
  camera: null | { para: Valores | "cam0"; desloc: number; dur: number; ease: string };
};

export const voltaLoop: Batida<ParamsVolta> = {
  id: "volta-loop",
  camada: "3d",
  descricao: "O aparelho nasce do símbolo do logo e volta pra pose do quadro 0, com a câmera voltando junto (loop).",
  ancoras: ["inicio"],
  padrao: {
    alvo: "aparelho",
    t: { fim: -0.95 },
    nasce: { de: "simbolo", s: 0.12 },
    pose: { para: "pose0", s: 1, desloc: 0.02, dur: 0.85, ease: "power2.out" },
    camera: { para: "cam0", desloc: -0.05, dur: 0.9, ease: "power2.inOut" },
  },
  sons: {
    v2: [{ som: "sint-s_whoosh", em: "inicio", desloc: 0, ganhoDb: -33, args: [0.6, 300, 5000] }],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const op = ctx.props.objetos.filter((o) => o.id === p.alvo)[0];
    const pose0 = resolvePose0(p.pose.para, op.pose);
    const t0 = ctx.t(p.t);
    if (p.nasce) {
      // {vis: 1, ...POSE0, x, y do símbolo, s}: mesma ordem de campos da linha 125
      const v: Record<string, unknown> = { vis: 1 };
      for (const k of Object.keys(pose0)) v[k] = pose0[k];
      if (p.nasce.de === "simbolo") {
        const sim = ctx.le<SimboloPublicado>("simbolo");
        if (!sim) {
          ctx.avisa('nenhuma batida publicou "simbolo" (falta a fecho-simbolo antes): o aparelho nasce na pose do quadro 0');
        } else if (typeof sim === "function") {
          v.x = () => sim().x;
          v.y = () => sim().y;
        } else {
          v.x = sim.x;
          v.y = sim.y;
        }
      } else {
        v.x = p.nasce.de[0];
        v.y = p.nasce.de[1];
      }
      v.s = p.nasce.s;
      tl.set(ap, v, t0); // linha 125
    }
    const para: Record<string, unknown> = {};
    for (const k of Object.keys(pose0)) para[k] = pose0[k];
    para.s = p.pose.s;
    tl.to(ap, vars(para, p.pose.dur, p.pose.ease), ctx.t({ desloc: p.pose.desloc }, t0)); // linha 126
    if (p.camera) tl.to(st.cam, vars(resolveCam0(p.camera.para, ctx.props.camera), p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc }, t0)); // linha 127
    ctx.som(ancoras({ inicio: t0 }));
  },
};
