// Transições entre cenas da biblioteca 2D da precificação (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 5).
// Funções PURAS (sem React), portadas do RM/src/Motion.tsx, que fica como está: as cinco transições do TR
// (iris, push, zoom, slideUp e wipeUp, aplicadas pelo Scene) e a câmera de cada cena (Camera: empurrão lento,
// socos nas palavras-chave e tremidas). Devolvem o estilo (translate, scale, rotate, clipPath, opacity, filter e
// zIndex) como o original monta, com os mesmos números e o mesmo texto de CSS.
// - estiloEntrada e estiloSaida recebem o progresso p (0 a 1) da transição: é o que a camada p2d-grupo usa,
//   com o p vindo da linha do tempo (batida p2d-transicao).
// - cenaT e cameraT recebem o tempo e a janela da cena, exatamente como o Scene e o Camera do Motion.tsx: é o que
//   o testes/equivalencia-2d.mjs compara com o original, em 200 instantes por tipo.
// clamp01, lerp, outCubic e inOutCubic vêm do próprio RM/src/lib/tl.ts (só importando).
import { clamp01, inOutCubic, lerp, outCubic } from "../../../lib/tl";
import { mola, tremida } from "./curvas";

export type TipoTransicao = "iris" | "push" | "zoom" | "slideUp" | "wipeUp";

/** os tipos, na ordem do código numérico que a batida grava no canal (entraTipo e saiTipo) */
export const TIPOS_TRANSICAO: TipoTransicao[] = ["iris", "push", "zoom", "slideUp", "wipeUp"];

/** durações do TR do Motion.tsx (a íris do fim do reel usa 0,52) */
export const DUR_TRANSICAO: Record<TipoTransicao, number> = { iris: 0.5, push: 0.44, zoom: 0.46, slideUp: 0.44, wipeUp: 0.42 };

/** centro da íris do TR[0] (gancho para o sinal 1) */
export const IRIS_PADRAO = { ox: 540, oy: 730 };

/** estilo CSS (as chaves são as do original: translate, scale, rotate, clipPath, opacity, filter, zIndex...) */
export type Estilo = Record<string, string | number>;

export type Transicao = { tipo: TipoTransicao; d: number; ox?: number; oy?: number };

/** a cena que ENTRA: o bloco "tin" do Scene (wrap no invólucro da cena; cont no conteúdo, dentro do fundo) */
export function estiloEntrada(tipo: TipoTransicao, p: number, ox?: number, oy?: number): { wrap: Estilo; cont: Estilo } {
  const wrap: Estilo = {};
  const cont: Estilo = {};
  const e = inOutCubic(p);
  const bl = Math.sin(Math.PI * p);
  if (tipo === "iris") wrap.clipPath = `circle(${(e * 2250).toFixed(1)}px at ${ox}px ${oy}px)`;
  if (tipo === "push") { wrap.translate = `${((1 - e) * 1080).toFixed(1)}px 0px`; wrap.filter = `blur(${(bl * 10).toFixed(2)}px)`; }
  if (tipo === "zoom") { cont.scale = `${lerp(0.7, 1, outCubic(p))}`; cont.filter = `blur(${((1 - outCubic(p)) * 14).toFixed(2)}px)`; }
  if (tipo === "slideUp") { wrap.translate = `0px ${((1 - e) * 1920).toFixed(1)}px`; wrap.filter = `blur(${(bl * 12).toFixed(2)}px)`; }
  if (tipo === "wipeUp") { wrap.clipPath = `inset(${((1 - e) * 100).toFixed(2)}% 0% 0% 0%)`; cont.translate = `0px ${((1 - e) * 260).toFixed(1)}px`; }
  return { wrap, cont };
}

/** a cena que SAI: o bloco "tout" do Scene (no zoom ela vai pra frente, zIndex 100) */
export function estiloSaida(tipo: TipoTransicao, p: number): { wrap: Estilo; z: number | null } {
  const wrap: Estilo = {};
  let z: number | null = null;
  const e = inOutCubic(p);
  const bl = Math.sin(Math.PI * p);
  if (tipo === "iris") wrap.scale = `${1 + 0.07 * e}`;
  if (tipo === "push") { wrap.translate = `${(-e * 1080).toFixed(1)}px 0px`; wrap.filter = `blur(${(bl * 10).toFixed(2)}px)`; }
  if (tipo === "zoom") { wrap.scale = `${1 + 1.6 * e * e}`; wrap.opacity = 1 - e; wrap.filter = `blur(${(e * 16).toFixed(2)}px)`; z = 100; }
  if (tipo === "slideUp") { wrap.translate = `0px ${(-e * 1920).toFixed(1)}px`; wrap.filter = `blur(${(bl * 12).toFixed(2)}px)`; }
  if (tipo === "wipeUp") wrap.translate = `0px ${(-e * 320).toFixed(1)}px`;
  return { wrap, z };
}

export type JanelaCena = { t0: number; t1: number; entra: Transicao | null; sai: Transicao | null; zBase: number };

/** o Scene do Motion.tsx com parâmetros: visível em [t0 - din/2, t1 + dout/2]; wrap já com o zIndex na frente */
export function cenaT(t: number, c: JanelaCena): { visivel: boolean; wrap: Estilo; cont: Estilo } {
  const a = c.t0 - (c.entra ? c.entra.d / 2 : 0);
  const b = c.t1 + (c.sai ? c.sai.d / 2 : 0);
  if (t < a || t > b) return { visivel: false, wrap: {}, cont: {} };
  const wrap: Estilo = {};
  const cont: Estilo = {};
  let z = c.zBase;
  if (c.entra && t < c.t0 + c.entra.d / 2) {
    const p = clamp01((t - a) / c.entra.d);
    const r = estiloEntrada(c.entra.tipo, p, c.entra.ox, c.entra.oy);
    for (const k of Object.keys(r.wrap)) wrap[k] = r.wrap[k];
    for (const k of Object.keys(r.cont)) cont[k] = r.cont[k];
  }
  if (c.sai && t > c.t1 - c.sai.d / 2) {
    const p = clamp01((t - (c.t1 - c.sai.d / 2)) / c.sai.d);
    const r = estiloSaida(c.sai.tipo, p);
    for (const k of Object.keys(r.wrap)) wrap[k] = r.wrap[k];
    if (r.z !== null) z = r.z;
  }
  const fora: Estilo = { zIndex: z };
  for (const k of Object.keys(wrap)) fora[k] = wrap[k];
  return { visivel: true, wrap: fora, cont };
}

/** valores da câmera de uma cena (o Camera do Motion.tsx): soco = mola em escala e rotação com o sinal
 *  alternado pelo índice; tremida = shake em x e y (y com 0,7 da amplitude e outra semente) */
export function cameraT(t: number, t0: number, t1: number, socos: number[], tremidas: Array<[number, number]>) {
  const u = clamp01((t - t0) / (t1 - t0));
  let sc = 1 + 0.04 * inOutCubic(u);
  let rot = 0;
  let dx = 0;
  let dy = 0;
  socos.forEach((pt, k) => {
    if (pt >= t0 - 0.1 && pt < t1) {
      sc += mola(t, pt - 0.03, 0.055, 2.4, 6);
      rot += mola(t, pt - 0.03, k % 2 ? 1.2 : -1.2, 2.4, 6);
    }
  });
  tremidas.forEach(([ts, a], k) => {
    if (ts >= t0 && ts < t1) {
      dx += tremida(t, ts, a, k * 1.7);
      dy += tremida(t, ts, a * 0.7, k * 2.3 + 1);
    }
  });
  return { sc, rot, dx, dy };
}

/** o estilo da câmera, com o texto do Camera do Motion.tsx (origem 50% 58%) */
export function estiloCamera(v: { sc: number; rot: number; dx: number; dy: number }, origem = "50% 58%"): Estilo {
  return { scale: `${v.sc}`, rotate: `${v.rot.toFixed(3)}deg`, translate: `${v.dx.toFixed(2)}px ${v.dy.toFixed(2)}px`, transformOrigin: origem };
}

/** a íris do fim do Motion.tsx (o círculo coral que fecha o reel e emenda no gancho): é a mesma entrada "iris",
 *  com p no intervalo [inicio, fim] em vez de centrado numa borda */
export function irisFimT(t: number, inicio: number, fim: number, ox = 540, oy = 1150): Estilo | null {
  const p = clamp01((t - inicio) / (fim - inicio));
  if (!(p > 0)) return null;
  return estiloEntrada("iris", p, ox, oy).wrap;
}
