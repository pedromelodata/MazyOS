// Cortes entre cenas da biblioteca 2D da precificação (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 5).
// Funções PURAS (sem React), portadas do RM/src/Broll.tsx, que fica como está: o trOf (chicote pra esquerda,
// chicote pra cima, zoom com desfoque e flash), o clarão branco dos cortes flash e a volta do loop (a última cena
// sai pela esquerda e a primeira volta pela direita). Os números e o texto de CSS são os do original.
// - estiloCorteEntrada, estiloCorteSaida, loopSaida e loopEntrada recebem o progresso p (0 a 1): é o que a camada
//   p2d-grupo usa, com o p vindo da linha do tempo (batida p2d-corte).
// - corteT, claraoT e loopEntradaT recebem o tempo, como o trOf e o Broll: é o que o testes/equivalencia-2d.mjs
//   compara com o original.
// clamp01, lerp, outCubic e inOutCubic vêm do próprio RM/src/lib/tl.ts (só importando).
import { clamp01, inOutCubic, lerp, outCubic } from "../../../lib/tl";
import type { Estilo } from "./transicoes";

export type TipoCorte = "whipL" | "whipUp" | "zoomBlur" | "flash" | "loop";

/** os tipos, na ordem do código numérico que a batida grava no canal (corteEntraTipo e corteSaiTipo) */
export const TIPOS_CORTE: TipoCorte[] = ["whipL", "whipUp", "zoomBlur", "flash", "loop"];

/** durações do broll-cuts.json do reel de 02/10 (o flash usou 0,24; o loop é o fim do Broll: dur - endT0) */
export const DUR_CORTE: Record<TipoCorte, number> = { whipL: 0.3, whipUp: 0.3, zoomBlur: 0.3, flash: 0.24, loop: 0.35 };

/** o clarão do flash: sobe em 0,08 s antes da borda e desce em 0,2 s depois (opacidade 0,85·clarão) */
export const CLARAO = { sobe: 0.08, desce: 0.2, opacidade: 0.85 };

export type Corte = { tipo: TipoCorte; b: number; d: number };

/** a cena que ENTRA no corte (o primeiro bloco do trOf); o flash não mexe no estilo, só esconde antes da borda */
export function estiloCorteEntrada(tipo: TipoCorte, p: number): Estilo {
  const style: Estilo = {};
  const e = inOutCubic(p);
  if (tipo === "whipL") { style.translate = `${((1 - e) * 1080).toFixed(1)}px 0px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
  if (tipo === "whipUp") { style.translate = `0px ${((1 - e) * 1920).toFixed(1)}px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
  if (tipo === "zoomBlur") { style.scale = `${lerp(1.35, 1, outCubic(p))}`; style.filter = `blur(${((1 - outCubic(p)) * 16).toFixed(2)}px)`; }
  return style;
}

/** a cena que SAI do corte (o segundo bloco do trOf); no zoomBlur ela vai pra frente, zIndex 100 */
export function estiloCorteSaida(tipo: TipoCorte, p: number): { style: Estilo; z: number | null } {
  const style: Estilo = {};
  let z: number | null = null;
  const e = inOutCubic(p);
  if (tipo === "whipL") { style.translate = `${(-e * 1080).toFixed(1)}px 0px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
  if (tipo === "whipUp") { style.translate = `0px ${(-e * 1920).toFixed(1)}px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
  if (tipo === "zoomBlur") { style.scale = `${1 + 0.8 * e * e}`; style.opacity = 1 - e; style.filter = `blur(${(e * 20).toFixed(2)}px)`; z = 100; }
  return { style, z };
}

/** a última cena saindo pela esquerda no fim (o bloco "fim" do trOf: o desfoque usa e, não p) */
export function loopSaida(p: number): Estilo {
  const e = inOutCubic(clamp01(p));
  return { translate: `${(-e * 1080).toFixed(1)}px 0px`, filter: `blur(${(Math.sin(Math.PI * e) * 16).toFixed(2)}px)` };
}

/** a cena que volta pela direita no fim (o endIn do Broll: aqui o desfoque usa p) */
export function loopEntrada(p: number): Estilo {
  if (!(p > 0)) return {};
  return { translate: `${((1 - inOutCubic(p)) * 1080).toFixed(1)}px 0px`, filter: `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)` };
}

export type JanelaCorte = { t0: number; t1: number; entra: Corte | null; sai: Corte | null; zBase: number; fim: { inicio: number; fim: number } | null };

/** o trOf do Broll.tsx com parâmetros: {style, z, hide} da cena na janela [t0, t1] */
export function corteT(t: number, c: JanelaCorte): { style: Estilo; z: number; hide: boolean } {
  const style: Estilo = {};
  let z = c.zBase;
  let hide = t < c.t0 || t > c.t1;
  if (c.entra) {
    const p = clamp01((t - (c.entra.b - c.entra.d / 2)) / c.entra.d);
    if (c.entra.tipo === "flash" && t < c.entra.b) hide = true;
    if (p < 1 && !hide) {
      const s = estiloCorteEntrada(c.entra.tipo, p);
      for (const k of Object.keys(s)) style[k] = s[k];
    }
  }
  if (c.sai) {
    const p = clamp01((t - (c.sai.b - c.sai.d / 2)) / c.sai.d);
    if (c.sai.tipo === "flash" && t >= c.sai.b) hide = true;
    if (p > 0 && !hide) {
      const r = estiloCorteSaida(c.sai.tipo, p);
      for (const k of Object.keys(r.style)) style[k] = r.style[k];
      if (r.z !== null) z = r.z;
    }
  }
  if (c.fim && t > c.fim.inicio) {
    const s = loopSaida((t - c.fim.inicio) / (c.fim.fim - c.fim.inicio));
    style.translate = s.translate;
    style.filter = s.filter;
  }
  return { style, z, hide };
}

/** o clarão dos cortes flash (0 a 1) no instante t, como o Broll calcula (o maior entre as bordas) */
export function claraoT(t: number, bordas: number[]): number {
  let flash = 0;
  for (const b of bordas) {
    if (t >= b - CLARAO.sobe && t < b) flash = Math.max(flash, (t - (b - CLARAO.sobe)) / CLARAO.sobe);
    if (t >= b && t < b + CLARAO.desce) flash = Math.max(flash, 1 - (t - b) / CLARAO.desce);
  }
  return flash;
}

/** o endIn do Broll no instante t (a primeira cena voltando no fim) */
export function loopEntradaT(t: number, inicio: number, fim: number): Estilo {
  return loopEntrada(clamp01((t - inicio) / (fim - inicio)));
}
