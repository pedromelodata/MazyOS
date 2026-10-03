// Batida "flip-troca-escondida" (coreografia.ts linhas 70, 75 a 79 e 82): o aparelho faz um flip no ar
// (antecipação curta, giro de uma volta com arrancada forte e assentamento longo, rolagem em Z de ida e volta)
// e a tela troca escondida enquanto o verso está de frente. A câmera mergulha junto.
// Instante "verso": acha u com ease(u) = (π + ry0) / (2π + ry0) (o ry cruza -π, o meio da janela em que o verso
// encara a câmera) com a ease de verdade do GSAP, e põe a troca meio quadro antes do primeiro quadro amostrado
// depois do cruzamento. No guia: o cruzamento medido na timeline original é 9,318186 s (quadro 279,55), porque
// o power3.out do GSAP é quártico (1 - (1 - u)^4); o verso fica de frente nos quadros 278 a 282 (5 quadros).
// O DESENHO (seção 5) diz 9,3586 s e 6 quadros: é a mesma conta com power3 cúbico. O guia usa o 9,35 do original.
import gsap from "gsap";
import type { Batida, Tempo } from "../nucleo/tipos";
import { ancoras, keyframes, objeto, telaDe, trocaSeca, vars, type Valores } from "./ajudantes";

export type ParamsFlip = {
  alvo: string;
  cameraAntes: null | { t: Tempo; para: Valores; dur: number; ease: string };
  t: Tempo;
  antecipacao: null | { para: Valores; dur: number; ease: string };
  giro: { desloc: number; para: Valores; dur: number; ease: string };
  rolagem: null | Array<Record<string, number | string>>;
  troca: { para: string; zera: Record<string, number>; instante: Tempo | "verso" };
  zeraRy: null | { desloc: number };
  camera: null | { desloc: number; para: Valores; dur: number; ease: string };
};

export type Verso = {
  t: number; // instante em que o ry cruza o múltiplo ímpar de π (o verso no meio da janela)
  quadro: number; // t·fps
  troca: number; // onde a troca entra: meio quadro antes do primeiro quadro amostrado (k/fps + 1e-4) depois de t
  entra: number; // o verso começa a encarar a câmera (ry cruza ±π/2 antes)
  sai: number; // o verso deixa de encarar (Infinity se o giro termina com o verso de frente)
  quadros: number; // quadros amostrados (k/fps + 1e-4) com o verso de frente
  ryVerso: number;
};

/** primeiro u em [0, 1] com ease(u) >= alvo (varredura fina + bisseção) */
function primeiroCruzamento(ease: (p: number) => number, alvo: number): number {
  if (ease(0) >= alvo) return 0;
  const N = 4000;
  let a = 0;
  for (let i = 1; i <= N; i++) {
    const b = i / N;
    if (ease(b) >= alvo) {
      let lo = a;
      let hi = b;
      for (let k = 0; k < 100; k++) {
        const m = (lo + hi) / 2;
        if (ease(m) >= alvo) hi = m;
        else lo = m;
      }
      return (lo + hi) / 2;
    }
    a = b;
  }
  return NaN;
}

/** acha o instante "verso" e a janela em que o verso fica de frente */
export function calculaVerso(o: {
  t0: number; dur: number; ease: string | ((p: number) => number); ry0: number; ryFim: number; fps: number; durVideo?: number;
}): Verso | null {
  const ease = typeof o.ease === "function" ? o.ease : (gsap.parseEase(o.ease) as unknown as ((p: number) => number) | undefined);
  if (!ease) throw new Error(`ease desconhecida no giro: ${String(o.ease)}`);
  const delta = o.ryFim - o.ry0;
  if (Math.abs(delta) < 1e-9) return null;
  const s = delta > 0 ? 1 : -1;
  const DP = 2 * Math.PI;
  // primeiro múltiplo ímpar de π no sentido do giro
  let m = s < 0 ? Math.floor((o.ry0 - Math.PI) / DP) : Math.ceil((o.ry0 - Math.PI) / DP);
  let v = (2 * m + 1) * Math.PI;
  if (s < 0 && v >= o.ry0) {
    m -= 1;
    v = (2 * m + 1) * Math.PI;
  }
  if (s > 0 && v <= o.ry0) {
    m += 1;
    v = (2 * m + 1) * Math.PI;
  }
  const eVerso = (v - o.ry0) / delta; // no guia: (π + ry0) / (2π + ry0)
  if (!(eVerso > 0 && eVerso <= 1)) return null; // o giro não chega no verso
  const uVerso = primeiroCruzamento(ease, eVerso);
  if (!isFinite(uVerso)) return null;
  const t = o.t0 + uVerso * o.dur;
  const eEntra = (v - (s * Math.PI) / 2 - o.ry0) / delta;
  const eSai = (v + (s * Math.PI) / 2 - o.ry0) / delta;
  const entra = eEntra <= 0 ? o.t0 : o.t0 + primeiroCruzamento(ease, eEntra) * o.dur;
  const uSai = eSai > 1 ? NaN : primeiroCruzamento(ease, eSai);
  const sai = isFinite(uSai) ? o.t0 + uSai * o.dur : Infinity;
  const ultimo = o.durVideo !== undefined ? o.durVideo : t + 10;
  let quadros = 0;
  for (let k = Math.max(0, Math.floor(entra * o.fps) - 2); ; k++) {
    const tk = k / o.fps + 1e-4;
    if (tk >= Math.min(sai, ultimo)) break;
    if (tk > entra) quadros++;
  }
  // primeiro quadro amostrado depois do cruzamento; a troca entra meio quadro antes dele (nunca num instante amostrado)
  const kDepois = Math.ceil((t - 1e-4) * o.fps);
  let troca = (kDepois - 0.5) / o.fps;
  if (troca <= entra || troca >= sai) troca = t;
  return { t, quadro: t * o.fps, troca, entra, sai, quadros, ryVerso: v };
}

export const flipTrocaEscondida: Batida<ParamsFlip> = {
  id: "flip-troca-escondida",
  camada: "3d",
  descricao: "Flip no ar: antecipação, uma volta inteira com rolagem e a tela troca escondida no verso; a câmera mergulha junto.",
  ancoras: ["antecipacao", "giro"],
  padrao: {
    alvo: "aparelho",
    cameraAntes: { t: 8.92, para: { tx: 0 }, dur: 0.26, ease: "power2.inOut" },
    t: 8.98,
    antecipacao: { para: { ry: 0.57, y: -0.01, z: -0.02, x: 0 }, dur: 0.2, ease: "power2.in" },
    giro: { desloc: 0.2, para: { ry: -Math.PI * 2, y: -0.004, z: 0 }, dur: 0.78, ease: "power3.out" },
    rolagem: [
      { rz: -0.4, rx: 0.1, dur: 0.32, ease: "sine.out" },
      { rz: 0, rx: 0.04, dur: 0.46, ease: "sine.inOut" },
    ],
    troca: { para: "inicioPagar", zera: { brilhoCard: 0, calc: 0, toque: 0 }, instante: "verso" }, // o guia usa 9.35
    zeraRy: { desloc: 1.0 },
    camera: { desloc: 0.2, para: { z: 0.25, y: 0.034, ty: 0.04, x: 0, tx: 0 }, dur: 0.92, ease: "power2.inOut" },
  },
  sons: {
    v2: [
      { som: "mixkit-166", em: "antecipacao", desloc: -0.1, ganhoDb: -27 },
      { som: "mixkit-1897", em: "giro", desloc: 0.52, ganhoDb: -36 },
      { som: "sint-s_whoosh", em: "giro", desloc: 0.44, ganhoDb: -33, args: [0.5, 500, 7000] },
    ],
    enxuto: [{ som: "mixkit-1490", em: "giro", desloc: -1.0, ganhoDb: -27, filtro: "areverse" }],
  },
  aplica(tl, st, p, ctx) {
    const ap = objeto(st, ctx, p.alvo);
    const tela = telaDe(st, p.alvo);
    const t0 = ctx.t(p.t);
    if (p.cameraAntes) tl.to(st.cam, vars(p.cameraAntes.para, p.cameraAntes.dur, p.cameraAntes.ease), ctx.t(p.cameraAntes.t, t0)); // linha 70
    if (p.antecipacao) tl.to(ap, vars(p.antecipacao.para, p.antecipacao.dur, p.antecipacao.ease), t0); // linha 75
    const tg = ctx.t({ desloc: p.giro.desloc }, t0);
    tl.to(ap, vars(p.giro.para, p.giro.dur, p.giro.ease), tg); // linha 76
    if (p.rolagem && p.rolagem.length) tl.to(ap, { keyframes: keyframes(p.rolagem) }, tg); // linha 77

    // instante da troca escondida
    let ry0: number;
    if (p.antecipacao && typeof p.antecipacao.para.ry === "number") ry0 = p.antecipacao.para.ry as number;
    else {
      ry0 = ap.ry;
      ctx.avisa(`ry no começo do giro estimado pela pose atual (${ry0}); declare antecipacao.para.ry pra ficar exato`);
    }
    const ryFim = p.giro.para.ry;
    const verso =
      typeof ryFim === "number"
        ? calculaVerso({ t0: tg, dur: p.giro.dur, ease: p.giro.ease, ry0, ryFim, fps: ctx.fps, durVideo: ctx.dur })
        : null;
    let ti: number;
    if (p.troca.instante === "verso") {
      if (!verso) throw new Error('o giro não mostra o verso: dê um instante numérico pra troca (troca.instante)');
      ti = ctx.t(verso.troca);
    } else {
      ti = ctx.t(p.troca.instante, t0);
    }
    if (verso) {
      if (verso.quadros < 4) ctx.avisa(`o verso fica de frente só ${verso.quadros} quadros (o mínimo é 4; com menos vira um piscar)`);
      if (ti <= verso.entra || ti >= verso.sai) {
        ctx.avisa(`a troca de tela (${ti.toFixed(3)} s) cai fora do verso (${verso.entra.toFixed(3)} a ${verso.sai.toFixed(3)} s)`);
      }
    }
    ctx.publica("verso", verso);
    trocaSeca(tl, tela, p.troca.para, p.troca.zera, ti, ctx); // linha 78
    if (p.zeraRy) tl.set(ap, { ry: 0 }, ctx.t({ desloc: p.zeraRy.desloc }, t0)); // linha 79: -2π é a mesma pose que 0
    if (p.camera) tl.to(st.cam, vars(p.camera.para, p.camera.dur, p.camera.ease), ctx.t({ desloc: p.camera.desloc }, t0)); // linha 82
    ctx.som(ancoras({ antecipacao: t0, giro: tg }));
  },
};
