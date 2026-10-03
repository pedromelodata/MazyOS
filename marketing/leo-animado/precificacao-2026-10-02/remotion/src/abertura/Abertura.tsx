import React, { useMemo, useRef } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import "../lib/font";
import { C, FONT } from "../lib/tl";
import { CommentIcon, Phone } from "../motion/kit";
import { Calendar3D, newCal, type CalState } from "./Calendar3D";
import { FPS } from "./timing";
import { SplitText, gsap, useMasterTimeline } from "./useMasterTimeline";

// Vídeo motion da peça de 01/10 (stories "Abertura do mês", pilar 16): comprovante do DAS + pergunta da rotina.
// Toda a coreografia é uma linha do tempo GSAP pausada, avançada pelo quadro do Remotion.
// Fatos: dia 20 = F062 (MEI) e F077 (ME); "a guia vem pronta, com o valor certo" = F010 + F063 (+F043 na ME);
// "app que tá chegando" = F008.
type Props = { leo: boolean };

const SHADOW = "0 26px 50px rgba(27,30,36,0.16), 0 6px 14px rgba(27,30,36,0.08)";

// ---------- Léo: reações sem fala (janelas de boca fechada dos takes de 02/10), trocadas nas batidas
type Seg = { tk: "T1" | "T2" | "T3" | "T4"; a: number; b: number };
const LEO_PLAN: { t0: number; segs: Seg[] }[] = [
  { t0: 0, segs: [{ tk: "T3", a: 150, b: 168 }] },
  { t0: 1, segs: [{ tk: "T1", a: 248, b: 299 }] },
  { t0: 3, segs: [{ tk: "T3", a: 180, b: 198 }, { tk: "T3", a: 210, b: 228 }] },
  { t0: 6, segs: [{ tk: "T2", a: 235, b: 269 }] },
  { t0: 9, segs: [{ tk: "T4", a: 85, b: 119 }] },
  { t0: 12, segs: [{ tk: "T3", a: 238, b: 248 }, { tk: "T3", a: 258, b: 269 }, { tk: "T2", a: 205, b: 220 }] },
  { t0: 15, segs: [{ tk: "T1", a: 248, b: 299 }] },
];
function leoFrame(t: number): string {
  let block = LEO_PLAN[0];
  for (const b of LEO_PLAN) if (t >= b.t0) block = b;
  const local = Math.floor((t - block.t0) * FPS + 1e-6);
  // concatena os segmentos e faz vai-e-volta (ping-pong) até a próxima troca
  const seq: [string, number][] = [];
  for (const s of block.segs) for (let k = s.a; k <= s.b; k++) seq.push([s.tk, k]);
  const n = seq.length;
  const cyc = 2 * n - 2;
  let i = local % Math.max(1, cyc);
  if (i >= n) i = cyc - i;
  const [tk, k] = seq[Math.max(0, Math.min(n - 1, i))];
  return staticFile(`leo/${tk}/${String(k).padStart(3, "0")}.webp`);
}

export const Abertura: React.FC<Props> = ({ leo }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const L = leo ? { cx: 395, cy: 1065, k: 0.8 } : { cx: 540, cy: 1130, k: 1 };
  const root = useRef<HTMLDivElement>(null);
  const cal = useMemo<CalState>(() => ({ ...newCal(), px: L.cx, py: L.cy, s: 1.45 * L.k }), [L.cx, L.cy, L.k]);

  const tl = useMasterTimeline((tl) => {
    const q = gsap.utils.selector(root);
    const words = (sel: string) => {
      const sp = SplitText.create(q(sel)[0], { type: "words,lines", mask: "lines", linesClass: "line", wordsClass: "word", ignore: ".marker" });
      return sp.words;
    };
    const textIn = (sel: string, at: number, stagger = 0.055) => {
      const w = words(sel);
      tl.set(q(sel), { autoAlpha: 1 }, at - 0.01);
      tl.from(w, { yPercent: 115, rotate: 4, duration: 0.42, stagger, ease: "lgEntra" }, at);
      return w;
    };
    const textOut = (sel: string, at: number) => {
      tl.to(q(`${sel} .line`), { yPercent: -60, autoAlpha: 0, filter: "blur(6px)", duration: 0.24, stagger: 0.03, ease: "lgSai" }, at);
    };
    // camada secundária: estouro de partículas clay nos impactos (motion-design: secondary action)
    const burst = (sel: string, at: number) => {
      const ps = q(`${sel} i`);
      tl.set(ps, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotate: 0 }, at - 0.001);
      ps.forEach((p: Element, i: number) => {
        const a = (i / ps.length) * Math.PI * 2 + (i % 2) * 0.35;
        const r = 120 + (i % 3) * 55;
        tl.to(p, { x: Math.cos(a) * r, y: Math.sin(a) * r - 30, rotate: (i % 2 ? 1 : -1) * 160, duration: 0.55, ease: "power3.out" }, at)
          .to(p, { autoAlpha: 0, scale: 0.3, duration: 0.25, ease: "power1.in" }, at + 0.32);
      });
    };
    const punch = (at: number, amt = 0.018) => {
      tl.to(q(".stage"), { scale: 1 + amt, duration: 0.07, ease: "power2.out" }, at);
      tl.to(q(".stage"), { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.45)" }, at + 0.07);
    };

    // estados iniciais (quadro 0 = capa: título aceso + calendário em SET)
    tl.set(q(".txt"), { autoAlpha: 0 }, 0);
    tl.set(q(".t1"), { autoAlpha: 1 }, 0);
    tl.set(q(".rcp, .fold, .phone, .mini, .moon, .cta, .pill-app, .burst circle, .bz i"), { autoAlpha: 0 }, 0);
    words(".t1");

    // ---- 1. gancho: antecipação, virada de página na virada da música (1,0 s)
    tl.to(cal, { sy: 0.95, sx: 1.04, flip: 0.06, duration: 0.4, ease: "power2.in" }, 0.6);
    tl.to(cal, { flip: 1, duration: 0.5, ease: "power3.out" }, 1.0);
    tl.to(cal, { pageVis: 0, duration: 0.16, ease: "power2.in" }, 1.3);
    burst(".bz1", 1.02);
    tl.to(cal, { sy: 1.07, sx: 0.97, duration: 0.12, ease: "power2.out" }, 1.0);
    tl.to(cal, { sy: 1, sx: 1, duration: 0.6, ease: "elastic.out(1, 0.35)" }, 1.12);
    tl.to(cal, { ry: 0.22, duration: 0.18, ease: "power2.out" }, 1.0).to(cal, { ry: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }, 1.18);
    tl.fromTo(q(".t1 .k"), { scale: 1 }, { scale: 1.08, duration: 0.1, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "50% 60%" }, 1.0);
    punch(1.0, 0.025);
    textOut(".t1", 2.72);
    tl.to(cal, { py: L.cy - 520 * L.k, px: L.cx - 260 * L.k, s: 0.35 * L.k, rz: 0.4, vis: 0, duration: 0.32, ease: "lgSai" }, 2.72);

    // ---- 2. guarde o comprovante: entra em arco, o selo carimba na batida (4,5 s)
    tl.fromTo(q(".rcp"), { autoAlpha: 0, y: 760, x: 120, rotate: -22, scale: 0.6 }, { autoAlpha: 1, y: 0, x: 0, rotate: -4, scale: 1, duration: 0.6, ease: "lgPousa" }, 3.0);
    textIn(".t2", 3.1);
    tl.fromTo(q(".seal"), { autoAlpha: 0, y: -260, scale: 1.9, rotate: -25 }, { autoAlpha: 1, y: -170, scale: 1.55, rotate: -14, duration: 0.3, ease: "power2.out" }, 4.05);
    tl.fromTo(q(".seal-shadow"), { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 0.35, scale: 1.3, duration: 0.3, ease: "power2.out" }, 4.05);
    tl.to(q(".seal"), { y: 0, scale: 1, rotate: -6, duration: 0.15, ease: "power4.in" }, 4.35);
    tl.to(q(".seal-shadow"), { autoAlpha: 0.0, scale: 1, duration: 0.15, ease: "power4.in" }, 4.35);
    tl.to(q(".seal"), { scaleX: 1.18, scaleY: 0.82, duration: 0.06, ease: "power2.out" }, 4.5).to(q(".seal"), { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 4.56);
    tl.to(q(".rcp-in"), { y: 10, rotate: 1.2, duration: 0.06 }, 4.5).to(q(".rcp-in"), { y: 0, rotate: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }, 4.56);
    tl.fromTo(q(".burst circle"), { attr: { r: 70 }, strokeWidth: 16, autoAlpha: 1 }, { attr: { r: 190 }, strokeWidth: 0, autoAlpha: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, 4.5);
    burst(".bz2", 4.52);
    tl.to(q(".stage"), { keyframes: { x: [0, 12, -9, 6, -3, 0], y: [0, -6, 7, -4, 2, 0] }, duration: 0.32, ease: "none" }, 4.5);
    textOut(".t2", 5.72);

    // ---- 3. é a sua prova: marca-texto em "prova"; o comprovante entra na pasta
    textIn(".t3", 6.05);
    tl.fromTo(q(".marker path"), { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.4, ease: "power2.inOut" }, 6.55);
    tl.fromTo(q(".fold"), { autoAlpha: 0, x: 560, rotate: 18, scale: 0.7 }, { autoAlpha: 1, x: 0, rotate: 0, scale: 1, duration: 0.5, ease: "lgPousa" }, 7.45);
    tl.to(q(".rcp"), { x: 150 * L.k, y: -30 * L.k, rotate: 8, scale: 0.86, duration: 0.25, ease: "power2.out" }, 7.75);
    tl.to(q(".rcp"), { x: 175 * L.k, y: 210 * L.k, scale: 0.42, rotate: 2, duration: 0.32, ease: "power3.in" }, 8.0);
    tl.set(q(".rcp"), { autoAlpha: 0 }, 8.33);
    tl.to(q(".fold-in"), { scaleY: 0.88, scaleX: 1.07, duration: 0.07, ease: "power2.out", transformOrigin: "50% 100%" }, 8.32)
      .to(q(".fold-in"), { scaleY: 1, scaleX: 1, duration: 0.55, ease: "elastic.out(1, 0.35)" }, 8.39);
    punch(8.32, 0.012);
    textOut(".t3", 8.72);
    tl.to(q(".fold"), { x: 520, y: 140, rotate: 16, autoAlpha: 0, duration: 0.3, ease: "lgSai" }, 8.72);

    // ---- 4. a guia vence todo dia 20: o calendário volta e marca o botão coral
    tl.fromTo(cal, { px: L.cx, py: L.cy + 900 * L.k, s: 0.6 * L.k, rz: -0.3, ry: -0.9, vis: 1 }, { px: L.cx, py: L.cy, s: 1.45 * L.k, rz: 0, ry: 0, duration: 0.65, ease: "lgPousa", immediateRender: false }, 9.0);
    textIn(".t4", 9.1);
    tl.to(cal, { marker: 1, duration: 0.45, ease: "back.out(2.2)" }, 10.0);
    burst(".bz3", 10.02);
    tl.to(cal, { pulse: 1, duration: 0.1, ease: "power2.out" }, 10.0).to(cal, { pulse: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 10.1);
    punch(10.0, 0.015);
    textOut(".t4", 11.72);
    tl.to(cal, { py: L.cy + 260, s: 0.2, ry: 0.9, vis: 0, duration: 0.3, ease: "lgSai" }, 11.75);

    // ---- 5. no app que tá chegando: o celular sobe e solta a guia pronta, com o selo
    tl.fromTo(q(".phone"), { autoAlpha: 0, y: 980, rotate: -14 }, { autoAlpha: 1, y: 0, rotate: -3, duration: 0.6, ease: "lgPousa" }, 12.0);
    tl.fromTo(q(".pill-app"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 12.5);
    textIn(".t5", 12.1, 0.045);
    tl.fromTo(q(".mini"), { autoAlpha: 0, y: 140, rotate: 0, scale: 0.92 }, { autoAlpha: 1, y: -300 * L.k, rotate: 7, scale: 1, duration: 0.5, ease: "lgPousa" }, 13.0);
    tl.fromTo(q(".mini-seal"), { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, 13.5);
    burst(".bz4", 13.52);
    punch(13.5, 0.012);
    textOut(".t5", 14.72);
    tl.to(q(".phone, .mini, .pill-app"), { y: "+=900", autoAlpha: 0, duration: 0.3, ease: "lgSai" }, 14.75);

    // ---- 6. CTA: a lua do sono e a pergunta da rotina de dono
    tl.fromTo(q(".moon"), { autoAlpha: 0, x: 320, y: -360, rotate: 28, scale: 0.6 }, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1, duration: 0.7, ease: "lgPousa" }, 15.0);
    textIn(".t6k", 15.05);
    textIn(".t6", 15.3, 0.05);
    tl.fromTo(q(".cta"), { autoAlpha: 0, scale: 0.3, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2.4)" }, 16.3);
    tl.to(q(".cta"), { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, 17.5);
    // trocas do Léo na batida: pulinho que esconde o corte entre reações
    if (leo) {
      for (const at of [1, 3, 6, 9, 12, 15]) {
        tl.to(q(".leo-in"), { scaleY: 0.93, scaleX: 1.04, duration: 0.06, ease: "power2.out", transformOrigin: "50% 100%" }, at)
          .to(q(".leo-in"), { scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }, at + 0.06);
      }
    }
  }, root);
  // +0,1 ms: no tempo exato 0 o GSAP não aplica os set() da posição 0 (a capa sairia sem o título)
  if (tl) tl.seek(t + 1e-4, false);

  // ambiente (fora da linha do tempo, por quadro): flutuação suave, estrelas, zzz, fundo
  const bob = (f: number, a: number, ph = 0) => Math.sin(t * f + ph) * a;
  const rcpW = 520 * L.k;
  const rcpH = rcpW * (1027 / 621);
  const sealW = rcpW * (209 / 621);
  const sealX = rcpW * (474 / 621) - sealW / 2;
  const sealY = rcpH * (762 / 1027) - sealW / 2;
  const foldW = 560 * L.k;
  const moonW = 470 * L.k;
  const calShadow = cal.vis > 0.01;
  const ctaText = leo ? "Me conta aqui" : "Conta pra gente aqui";
  const txtBase: React.CSSProperties = {
    position: "absolute", left: 70, width: 940, top: 205, minHeight: 420, display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: FONT, fontWeight: 800, color: C.ink,
    letterSpacing: "-0.035em", lineHeight: 1.04, visibility: "hidden",
  };

  return (
    <AbsoluteFill ref={root} style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <style>{`.k{color:${C.coral6}} .mark{position:relative;display:inline-block} .marker{position:absolute;left:-4%;bottom:-0.08em;width:108%;height:0.36em;overflow:visible}`}</style>
      {/* fundo: papel + grade de pontos derivando + duas manchas tint (camada ambiente) */}
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, rgba(203,197,188,0.55) 2.3px, transparent 2.9px)", backgroundSize: "44px 44px", backgroundPosition: `${(t * 10) % 44}px ${(t * 6) % 44}px` }} />
      <div style={{ position: "absolute", left: 600 + bob(0.35, 60), top: 380 + bob(0.28, 50, 1), width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(254,243,238,0.95), rgba(254,243,238,0))" }} />
      <div style={{ position: "absolute", left: -260 + bob(0.3, 50, 2), top: 1250 + bob(0.25, 60), width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(241,238,233,0.9), rgba(241,238,233,0))" }} />

      <AbsoluteFill className="stage" style={{ transformOrigin: "50% 58%" }}>
        {/* sombra de contato do calendário 3D (segue o estado da linha do tempo) */}
        {calShadow && (
          <div style={{ position: "absolute", left: cal.px - 260 * cal.s * cal.vis, top: cal.py + 330 * cal.s * cal.vis, width: 520 * cal.s * cal.vis, height: 70 * cal.s * cal.vis, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(27,30,36,0.18), rgba(27,30,36,0))" }} />
        )}
        <Calendar3D cal={cal} />
        {[
          { c: "bz1", x: L.cx, y: L.cy - 260 * L.k },
          { c: "bz2", x: L.cx + 75 * L.k, y: L.cy + 290 * L.k },
          { c: "bz3", x: L.cx + 80 * L.k, y: L.cy - 70 * L.k },
          { c: "bz4", x: L.cx + 130 * L.k, y: L.cy - 420 * L.k },
        ].map((b) => (
          <div key={b.c} className={`bz ${b.c}`} style={{ position: "absolute", left: b.x, top: b.y, zIndex: 5 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <i key={i} style={{ position: "absolute", left: -9, top: -9, width: i % 3 === 0 ? 22 : 16, height: i % 3 === 0 ? 12 : 16, borderRadius: i % 2 ? 99 : 5, background: [C.coral, "#F8C3B0", C.coral6, "#EAE1D6"][i % 4], boxShadow: "0 3px 6px rgba(27,30,36,0.12)" }} />
            ))}
          </div>
        ))}

        {/* comprovante + selo (atrás da pasta) */}
        <div className="rcp" style={{ position: "absolute", left: L.cx - rcpW / 2, top: L.cy - rcpH / 2 + 30 * L.k, width: rcpW, height: rcpH }}>
          <div className="rcp-in" style={{ position: "absolute", inset: 0, translate: `0px ${bob(2.2, 8)}px`, rotate: `${bob(1.6, 1.2)}deg` }}>
            <Img src={staticFile("clay/comprovante-sem-selo.png")} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 26px 30px rgba(27,30,36,0.18))" }} />
            <div className="seal-shadow" style={{ position: "absolute", left: sealX + sealW * 0.1, top: sealY + sealW * 0.18, width: sealW * 0.85, height: sealW * 0.85, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(27,30,36,0.55), rgba(27,30,36,0))" }} />
            <svg className="burst" width={rcpW} height={rcpH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <circle cx={sealX + sealW / 2} cy={sealY + sealW / 2} r={70} fill="none" stroke={C.coral} strokeWidth={0} />
            </svg>
            <Img className="seal" src={staticFile("clay/selo.png")} style={{ position: "absolute", left: sealX, top: sealY, width: sealW, height: sealW * (215 / 209) }} />
          </div>
        </div>

        {/* pasta */}
        <div className="fold" style={{ position: "absolute", left: L.cx + 150 * L.k - foldW / 2, top: L.cy + 120 * L.k - foldW / 2, width: foldW, height: foldW * (809 / 810) }}>
          <div className="fold-in" style={{ position: "absolute", inset: 0 }}>
            <Img src={staticFile("clay/pasta.png")} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 24px 28px rgba(27,30,36,0.18))" }} />
          </div>
        </div>

        {/* app: guia pronta sai de trás do celular */}
        <div className="mini" style={{ position: "absolute", left: L.cx - 115 * L.k, top: L.cy - 150 * L.k, width: 230 * L.k, height: 230 * L.k * (1027 / 621) }}>
          <Img src={staticFile("clay/comprovante.png")} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 16px 20px rgba(27,30,36,0.18))" }} />
          <div className="mini-seal" style={{ position: "absolute", right: -26 * L.k, top: -26 * L.k, width: 110 * L.k, height: 110 * L.k, borderRadius: "50%", background: C.coral6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SHADOW }}>
            <svg width={64 * L.k} height={64 * L.k} viewBox="0 0 70 70"><path d="M14 37 L29 51 L56 20" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div className="phone" style={{ position: "absolute", left: L.cx - 175 * L.k, top: L.cy - 250 * L.k, translate: `0px ${bob(2, 6)}px` }}>
          <Phone w={350 * L.k} />
        </div>
        <div className="pill-app" style={{ position: "absolute", left: L.cx - 240, width: 480, top: L.cy + 520 * L.k, textAlign: "center", whiteSpace: "nowrap" }}>
          <span style={{ background: C.alt, borderRadius: 30, padding: "10px 24px", fontFamily: FONT, fontWeight: 700, fontSize: 22, color: C.ink2, letterSpacing: "0.14em" }}>APP EM CONSTRUÇÃO</span>
        </div>

        {/* lua do sono */}
        <div className="moon" style={{ position: "absolute", left: L.cx - moonW / 2, top: L.cy - moonW * 0.62, width: moonW, height: moonW * (686 / 648) }}>
          <div style={{ position: "absolute", inset: 0, translate: `0px ${bob(1.8, 10)}px`, rotate: `${bob(1.2, 3)}deg` }}>
            <Img src={staticFile("clay/lua-sem-estrelas.png")} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 26px 30px rgba(27,30,36,0.16))" }} />
            {[
              { src: "clay/estrela1.png", x: 0.61, y: 0.28, w: 0.2, ph: 0 },
              { src: "clay/estrela2.png", x: 0.79, y: 0.51, w: 0.25, ph: 1.7 },
            ].map((s) => (
              <Img key={s.src} src={staticFile(s.src)} style={{ position: "absolute", left: moonW * (s.x - s.w / 2), top: moonW * (s.y - s.w / 2), width: moonW * s.w, scale: `${1 + 0.16 * Math.sin(t * 5 + s.ph)}`, rotate: `${bob(2.5, 10, s.ph)}deg` }} />
            ))}
            {[0, 1, 2].map((k) => {
              const u = ((t * 0.55 + k / 3) % 1);
              return (
                <div key={k} style={{ position: "absolute", left: moonW * (0.18 - 0.06 * k) + u * 40, top: moonW * (0.12 - u * 0.4), fontFamily: FONT, fontWeight: 800, fontSize: (44 - k * 8) * L.k, color: C.coral6, opacity: Math.sin(Math.PI * u) }}>z</div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* Léo reagindo (versão com o Léo) */}
      {leo && (
        <div style={{ position: "absolute", left: 600, top: 905, width: 1015 * (720 / 1280), height: 1015 }}>
          <div className="leo-in" style={{ position: "absolute", inset: 0 }}>
            <Img src={leoFrame(t)} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 0 #fff) drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 20px 30px rgba(27,30,36,0.18))" }} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="cta" style={{ position: "absolute", left: leo ? 60 : 540 - 300, width: leo ? 500 : 600, top: leo ? 1330 : 1450, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: C.white, borderRadius: 999, padding: "16px 34px 16px 22px", boxShadow: SHADOW, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
          <div style={{ width: 62, height: 54 }}><CommentIcon t={t} w={62} /></div>
          {ctaText}
        </div>
      </div>

      {/* tipografia cinética */}
      <div className="txt t1" style={{ ...txtBase, fontSize: 124 }}><div>Mês novo,</div><div><span className="k">hábito novo.</span></div></div>
      <div className="txt t2" style={{ ...txtBase, fontSize: 96 }}><div>Guarde o <span className="k">comprovante</span></div><div>do DAS.</div></div>
      <div className="txt t3" style={{ ...txtBase, fontSize: 90 }}>
        <div>É a sua <span className="k mark">prova<svg className="marker" viewBox="0 0 200 30" preserveAspectRatio="none"><path d="M4 22 C50 14 120 12 196 18" stroke={C.coral} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.85} /></svg></span> de que a guia foi paga.</div>
      </div>
      <div className="txt t4" style={{ ...txtBase, fontSize: 100 }}><div>A guia vence todo <span className="k">dia 20.</span></div></div>
      <div className="txt t5" style={{ ...txtBase, fontSize: 76 }}><div>No app que tá chegando, a guia vem <span className="k">pronta</span>, com o valor certo.</div></div>
      <div className="txt t6k" style={{ ...txtBase, top: 170, minHeight: 90, fontSize: 50, fontWeight: 700, color: C.ink2 }}><div>E pra você:</div></div>
      <div className="txt t6" style={{ ...txtBase, top: 270, minHeight: 360, fontSize: 84 }}><div>qual parte da rotina de dono mais tira seu <span className="k">sono?</span></div></div>

      <Audio src={staticFile("mix-abertura.wav")} />
    </AbsoluteFill>
  );
};
