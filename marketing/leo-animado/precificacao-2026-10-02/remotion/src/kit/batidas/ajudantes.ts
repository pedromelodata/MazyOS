// Ajudantes das batidas (dono K02): trocaTela, entra, sai, vibra e varredura, mais as conversões de
// parâmetro em vars do GSAP. Regra de ouro pra regressão: cada vars sai com os campos na mesma ordem da
// coreografia original (campos animados, depois duration e ease) e sempre num objeto novo (o GSAP mexe nos vars).
import type { CamSt, Ctx, Estado, Obj, ObjSt, TelaSt, Tempo } from "../nucleo/tipos";

export type Valores = Record<string, number | string>;
export type Movimento = { para: Valores; dur: number; ease: string; desloc?: number };

/** vars de um tween: os campos de `para` (na ordem), depois duration, ease e os extras */
export function vars(para: Record<string, unknown>, dur?: number, ease?: string, extra?: Record<string, unknown>): gsap.TweenVars {
  const v: Record<string, unknown> = {};
  for (const k of Object.keys(para)) v[k] = para[k];
  if (dur !== undefined) v.duration = dur;
  if (ease !== undefined) v.ease = ease;
  if (extra) for (const k of Object.keys(extra)) v[k] = extra[k];
  return v as gsap.TweenVars;
}

/** chaves {campo..., dur, ease?} viram keyframes {campo..., duration, ease?} */
export function keyframes(lista: Array<Record<string, unknown>>): gsap.TweenVars[] {
  return lista.map((item) => {
    const k: Record<string, unknown> = {};
    for (const c of Object.keys(item)) if (c !== "dur" && c !== "ease") k[c] = item[c];
    k.duration = item.dur;
    if (item.ease !== undefined) k.ease = item.ease;
    return k as gsap.TweenVars;
  });
}

/** objeto da cena pelo id, com conferência do tipo quando a batida restringe */
export function objeto(st: Estado, ctx: Ctx, id: string, tipos?: string[]): ObjSt {
  const o = st.obj[id];
  if (!o) throw new Error(`objeto citado não existe: "${id}" (a cena tem: ${Object.keys(st.obj).join(", ") || "nenhum"})`);
  if (tipos) {
    const op = ctx.props.objetos.filter((x) => x.id === id)[0];
    const tipo = op ? op.tipo : "?";
    if (tipos.indexOf(tipo) < 0) throw new Error(`o objeto "${id}" é do tipo "${tipo}"; esta batida aceita: ${tipos.join(", ")}`);
  }
  return o;
}

/** estado da tela de um aparelho */
export function telaDe(st: Estado, id: string): TelaSt {
  const t = st.telas[id];
  if (!t) throw new Error(`o objeto "${id}" não é um aparelho com tela (aparelhos da cena: ${Object.keys(st.telas).join(", ") || "nenhum"})`);
  return t;
}

/** a tela citada tem de existir nas telas da cena ("apagada" é a tela desligada) */
export function exigeTela(ctx: Ctx, chave: string): void {
  if (chave === "apagada") return;
  if (!ctx.props.telas || !ctx.props.telas[chave]) {
    throw new Error(`tela citada não existe: "${chave}" (a cena tem: ${Object.keys(ctx.props.telas || {}).join(", ") || "nenhuma"})`);
  }
}

/** instante de uma parte da batida: o Tempo dela, se houver; senão {desloc} a partir do t da batida */
export function instante(ctx: Ctx, base: number, t: Tempo | undefined, desloc?: number): number {
  if (t !== undefined && t !== null) return ctx.t(t, base);
  return ctx.t({ desloc: desloc || 0 }, base);
}

/** "cam0" vira a câmera inicial da cena (inteira, na ordem x, y, z, tx, ty, tz, fov) ou campo a campo */
export function resolveCam0(para: Valores | "cam0", cam0: CamSt): Record<string, number> {
  const ordem: Array<keyof CamSt> = ["x", "y", "z", "tx", "ty", "tz", "fov"];
  const r: Record<string, number> = {};
  if (para === "cam0") {
    for (const k of ordem) r[k] = cam0[k];
    return r;
  }
  for (const k of Object.keys(para)) {
    const v = para[k];
    r[k] = v === "cam0" ? (cam0 as Record<string, number>)[k] : (v as number);
  }
  return r;
}

/** "pose0" vira a pose inicial do objeto (x, y, z, rx, ry, rz) ou campo a campo */
export function resolvePose0(para: Valores | "pose0", pose0: Obj): Record<string, number> {
  const ordem: Array<keyof Obj> = ["x", "y", "z", "rx", "ry", "rz"];
  const r: Record<string, number> = {};
  if (para === "pose0") {
    for (const k of ordem) r[k] = pose0[k];
    return r;
  }
  for (const k of Object.keys(para)) {
    const v = para[k];
    r[k] = v === "pose0" ? (pose0 as Record<string, number>)[k] : (v as number);
  }
  return r;
}

export type ParamsTroca = {
  de?: string; para: string; modo?: number; dur: number; ease: string; fim: number;
  zera?: Record<string, number>; zeraEm?: "inicio" | "fim";
};

/** troca de tela com transição, como no guia: set {a, b, modo, p: 0}, to {p: 1} e set {a: para, b: para, p: 0}
 *  no fim. `zera` entra no set do começo (zeraEm "inicio", o empurrar) ou no do fim (zeraEm "fim", o app fecha) */
export function trocaTela(tl: gsap.core.Timeline, tela: TelaSt, p: ParamsTroca, t: number, ctx: Ctx): number {
  exigeTela(ctx, p.para);
  if (p.de !== undefined) exigeTela(ctx, p.de);
  const zera = p.zera || {};
  const noFim = p.zeraEm === "fim";
  const ini: Record<string, unknown> = {};
  if (p.de !== undefined) ini.a = p.de;
  ini.b = p.para;
  ini.modo = p.modo === undefined ? 0 : p.modo;
  ini.p = 0;
  if (!noFim) for (const k of Object.keys(zera)) ini[k] = zera[k];
  tl.set(tela, ini, t);
  tl.to(tela, { p: 1, duration: p.dur, ease: p.ease }, t);
  const fim: Record<string, unknown> = { a: p.para, b: p.para, p: 0 };
  if (noFim) for (const k of Object.keys(zera)) fim[k] = zera[k];
  const tf = ctx.t({ desloc: p.fim }, t);
  tl.set(tela, fim, tf);
  return tf;
}

/** troca seca (sem transição), como a do flip: set {a: para, b: para, p: 0, ...zera} */
export function trocaSeca(tl: gsap.core.Timeline, tela: TelaSt, para: string, zera: Record<string, number> | undefined, t: number, ctx: Ctx): void {
  exigeTela(ctx, para);
  const v: Record<string, unknown> = { a: para, b: para, p: 0 };
  if (zera) for (const k of Object.keys(zera)) v[k] = zera[k];
  tl.set(tela, v, t);
}

/** entra: set na pose de partida (opcional) e tween até a pose de chegada, no mesmo instante */
export function entra(tl: gsap.core.Timeline, alvo: object, de: Record<string, number> | null | undefined, m: { para: Valores; dur: number; ease: string }, t: number): void {
  if (de) tl.set(alvo, { ...de }, t);
  tl.to(alvo, vars(m.para, m.dur, m.ease), t);
}

/** sai: tween de saída e, com `esconde`, set {vis: 0} depois desse tempo */
export function sai(tl: gsap.core.Timeline, alvo: object, m: { para: Valores; dur: number; ease: string; esconde?: number | null }, t: number, ctx: Ctx): void {
  tl.to(alvo, vars(m.para, m.dur, m.ease), t);
  if (m.esconde !== undefined && m.esconde !== null) tl.set(alvo, { vis: 0 }, ctx.t({ desloc: m.esconde }, t));
}

/** vibra: pulsos de buzz [valor, duração, ease?] em keyframes (sem ease no pulso, como no guia) */
export function vibra(tl: gsap.core.Timeline, alvo: ObjSt, pulsos: Array<Array<number | string>>, t: number): void {
  const kf = pulsos.map((p) => {
    const k: Record<string, unknown> = { buzz: p[0], duration: p[1] };
    if (p[2] !== undefined) k.ease = p[2];
    return k as gsap.TweenVars;
  });
  tl.to(alvo, { keyframes: kf }, t);
}

/** varredura de luz: fromTo {varre: 0} até {varre: 1}, sem render imediato */
export function varredura(tl: gsap.core.Timeline, luz: Estado["luz"], dur: number, ease: string, t: number): void {
  tl.fromTo(luz, { varre: 0 }, { varre: 1, duration: dur, ease, immediateRender: false }, t);
}

/** âncoras só com os instantes que existem nesta aplicação (parte desligada = som não toca) */
export function ancoras(x: Record<string, number | undefined>): Record<string, number> {
  const r: Record<string, number> = {};
  for (const k of Object.keys(x)) {
    const v = x[k];
    if (typeof v === "number") r[k] = v;
  }
  return r;
}
