import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import "./lib/font";
import { C, FONT, FPS, clamp01, inOutCubic, lerp, outCubic } from "./lib/tl";
import { M, PUNCH_I, TI, TIw } from "./lib/tli";
import cuts from "./data/broll-cuts.json";
import { AppleCaptions } from "./parts/AppleCaptions";
import { At, Check, CommentIcon, Confetti, CO, DK, Eye, NumDot, Phone, Pill, ROT, TetoCard, inn, spring } from "./motion/kit";

// Versão b-roll (sem o Léo): um clipe por fala, cortes com chicote/zoom/flash, legenda Apple sobre o scrim da marca.
const SEG = cuts.segments;
const BND = cuts.bounds;
const TD = cuts.d;
const KIND = cuts.kind;
const pad3 = (n: number) => String(n).padStart(3, "0");
const SCRIM = "linear-gradient(to top, rgba(21,23,28,.94) 4%, rgba(21,23,28,.55) 46%, rgba(42,46,55,.10) 100%)";
const END0 = TI.endT0;

type Tr = { style: React.CSSProperties; z: number; hide: boolean };

// transformação de transição da cena k no tempo t (usada no vídeo e nos elementos da cena)
function trOf(k: number, t: number): Tr {
  const s = SEG[k];
  const style: React.CSSProperties = {};
  let z = k * 2;
  let hide = t < s.t0 || t > s.t1;
  if (k > 0) {
    const b = BND[k - 1], d = TD[k - 1], kind = KIND[k - 1];
    const p = clamp01((t - (b - d / 2)) / d);
    const e = inOutCubic(p);
    if (kind === "flash" && t < b) hide = true;
    if (p < 1 && !hide) {
      if (kind === "whipL") { style.translate = `${((1 - e) * 1080).toFixed(1)}px 0px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
      if (kind === "whipUp") { style.translate = `0px ${((1 - e) * 1920).toFixed(1)}px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
      if (kind === "zoomBlur") { style.scale = `${lerp(1.35, 1, outCubic(p))}`; style.filter = `blur(${((1 - outCubic(p)) * 16).toFixed(2)}px)`; }
    }
  }
  if (k < SEG.length - 1) {
    const b = BND[k], d = TD[k], kind = KIND[k];
    const p = clamp01((t - (b - d / 2)) / d);
    const e = inOutCubic(p);
    if (kind === "flash" && t >= b) hide = true;
    if (p > 0 && !hide) {
      if (kind === "whipL") { style.translate = `${(-e * 1080).toFixed(1)}px 0px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
      if (kind === "whipUp") { style.translate = `0px ${(-e * 1920).toFixed(1)}px`; style.filter = `blur(${(Math.sin(Math.PI * p) * 16).toFixed(2)}px)`; }
      if (kind === "zoomBlur") { style.scale = `${1 + 0.8 * e * e}`; style.opacity = 1 - e; style.filter = `blur(${(e * 20).toFixed(2)}px)`; z = 100; }
    }
  }
  // fim: a última cena sai de lado e o gancho volta (loop)
  if (k === SEG.length - 1 && t > END0) {
    const e = inOutCubic(clamp01((t - END0) / (TI.dur - END0)));
    style.translate = `${(-e * 1080).toFixed(1)}px 0px`;
    style.filter = `blur(${(Math.sin(Math.PI * e) * 16).toFixed(2)}px)`;
  }
  return { style, z, hide };
}

// quadro do vídeo da cena k, com empurrão lento e socos nas palavras-chave
const Video: React.FC<{ k: number; t: number; frame?: number }> = ({ k, t, frame }) => {
  const s = SEG[k];
  const f = frame ?? Math.min(s.n - 1, Math.max(0, Math.floor((t - s.t0) * FPS)));
  const u = clamp01((t - s.t0) / (s.t1 - s.t0));
  let sc = 1.03 + 0.07 * u;
  if (frame === undefined) PUNCH_I.forEach((pt) => { if (pt >= s.t0 && pt < s.t1) sc += spring(t, pt - 0.03, 0.06, 2.4, 6); });
  let filter: string | undefined;
  if (s.id === "s6") {
    const k2 = clamp01((t - (M.comenta - 0.32)) / 0.4);
    filter = `blur(${(18 * (1 - k2)).toFixed(2)}px) brightness(${lerp(0.62, 1, k2).toFixed(3)})`;
  }
  return (
    <AbsoluteFill style={{ scale: `${sc}`, filter }}>
      <Img src={staticFile(`v/${s.id}/${pad3(f)}.jpg`)} style={{ width: "100%", height: "100%", display: "block" }} />
    </AbsoluteFill>
  );
};

// ---------- gancho: "3 sinais" aceso desde o quadro 0
const HookTitle: React.FC<{ t: number; still?: boolean }> = ({ t, still }) => {
  const sp = (i: number, a: number) => (still ? 0 : spring(t, TIw(i) - 0.02, a, 2.4, 5.5));
  return (
    <>
      <At x={540} y={1040} sc={1 + sp(0, 0.09)}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 26, fontFamily: FONT, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, whiteSpace: "nowrap", textShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
          <span style={{ fontSize: 290, color: C.coral, scale: `${1 + sp(0, 0.08)}`, display: "inline-block" }}>3</span>
          <span style={{ fontSize: 172, color: "#fff", scale: `${1 + sp(1, 0.08)}`, display: "inline-block" }}>sinais</span>
        </div>
      </At>
      <At x={540} y={1196} sc={1 + sp(6, 0.04)}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 56, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap", textShadow: "0 4px 18px rgba(0,0,0,0.45)" }}>de que você já pode cobrar</div>
      </At>
      <At x={540} y={1322} rot={-3 + sp(9, 4)} sc={1 + sp(8, 0.05) + sp(9, 0.12)}>
        <div style={{ background: C.coral6, borderRadius: 28, padding: "6px 36px 14px", fontFamily: FONT, fontWeight: 800, fontSize: 108, color: "#fff", letterSpacing: "-0.04em", whiteSpace: "nowrap", boxShadow: "0 20px 44px rgba(0,0,0,0.35)" }}>
          mais caro
        </div>
      </At>
    </>
  );
};

// chip de número do sinal
const SignChip: React.FC<{ t: number; n: number; ts: number }> = ({ t, n, ts }) => {
  const p = inn(t, ts - 0.1, 0.34, 0.3, 2.2);
  if (p.al <= 0) return null;
  return (
    <At x={540} y={1070} sc={p.sc * (1 + spring(t, ts + 0.2, 0.08, 2.4, 6))} al={p.al}>
      <div style={{ width: 148, height: 148, borderRadius: "50%", background: C.coral6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(0,0,0,0.35)" }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 92, color: "#fff", letterSpacing: "-0.03em" }}>{n}</span>
      </div>
    </At>
  );
};

// ---------- elementos por cena
const Over: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const id = SEG[k].id;
  if (id === "hook") return <HookTitle t={t} />;
  if (id === "s1") return <SignChip t={t} n={1} ts={M.um} />;
  if (id === "s2") return <SignChip t={t} n={2} ts={M.dois} />;
  if (id === "s3") return <SignChip t={t} n={3} ts={M.tres2} />;
  if (id === "s4") {
    const out1 = clamp01((t - (M.ta - 0.1)) / 0.22);
    const ar = inn(t, M.reajustar - 0.1, 0.36, 0.3, 2);
    return (
      <>
        {out1 < 1 &&
          [0, 1, 2].map((j) => {
            const p = inn(t, SEG[k].t0 + 0.1 + 0.07 * j, 0.3, 0.4, 2);
            const on = j < 2 ? clamp01((t - (M.doisq + 0.1 * j)) / 0.2) : 0;
            return (
              <At key={j} x={540 + (j - 1) * 170} y={1070} sc={p.sc * (1 + spring(t, M.doisq + 0.1 * j, j < 2 ? 0.2 : 0, 2.6, 6))} al={p.al * (1 - out1) * (j === 2 && t > M.doisq + 0.3 ? 0.6 : 1)}>
                {on > 0 ? <Check on={on} size={120} /> : <NumDot n={j + 1} size={120} />}
              </At>
            );
          })}
        {ar.al > 0 && (
          <At x={540} y={1070 - 40 * outCubic(clamp01((t - M.reajustar) / 0.5))} sc={ar.sc} al={ar.al}>
            <div style={{ width: 160, height: 160, borderRadius: "50%", background: C.coral6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(0,0,0,0.35)" }}>
              <svg width={92} height={100} viewBox="0 0 60 66"><path d="M30 3 L57 33 H41 V63 H19 V33 H3 Z" fill="#fff" /></svg>
            </div>
          </At>
        )}
      </>
    );
  }
  if (id === "s5") {
    const disc = inn(t, M.cobrar - 0.05, 0.45, 0.3, 1.7);
    const plus = inn(t, M.cobrar + 0.2, 0.34, 0.3, 2.2);
    const bob = Math.sin((t - M.cobrar) * 2.5) * 8;
    const flash = t >= M.cresceu ? clamp01(1 - (t - M.cresceu) / 0.22) : 0;
    return (
      <>
        {disc.al > 0 && (
          <At x={540} y={660 + bob} sc={disc.sc * (1 + spring(t, M.negocio, 0.05, 2.4, 6) + spring(t, M.cresceu - 0.02, 0.14, 2.2, 5))} al={disc.al}>
            <div style={{ width: 470, height: 470, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 26px 60px rgba(27,30,36,0.28)" }}>
              <Img src={staticFile("icons/growth.webp")} style={{ width: 380, height: 380 }} />
            </div>
          </At>
        )}
        {plus.al > 0 && (
          <At x={742} y={470 + bob * 0.6} sc={plus.sc} al={plus.al} rot={10}>
            <div style={{ width: 138, height: 138, borderRadius: "50%", background: C.coral6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}>
              <svg width={74} height={74} viewBox="0 0 92 92"><path d="M46 10 V82 M10 46 H82" stroke="#fff" strokeWidth={17} strokeLinecap="round" /></svg>
            </div>
          </At>
        )}
        <Confetti t={t} t0={M.cresceu - 0.02} x={540} y={620} cols={["#FFFFFF", C.coral, CO.c200, C.coral6]} n={60} />
        {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.35 }} />}
      </>
    );
  }
  // s6: app (sobre o clipe desfocado) e depois o CTA (clipe nítido)
  const cta = t >= M.comenta - 0.16;
  if (!cta) {
    const t0 = SEG[k].t0;
    const fo = 1 - clamp01((t - (M.comenta - 0.36)) / 0.2);
    const br = inn(t, t0 + 0.2, 0.42, 0.7, 1.5);
    const ph = clamp01((t - (M.app - 0.14)) / 0.6);
    const py = lerp(2300, 800, outCubic(ph) + 0.08 * Math.sin(Math.PI * clamp01(ph * 1.2)));
    const px = lerp(540, 318, inOutCubic((t - (M.olho - 0.4)) / 0.5));
    const eye = inn(t, M.olho - 0.06, 0.34, 0.4, 1.8);
    const tb = t - 19.95;
    const blink = tb > 0 && tb < 0.22 ? Math.abs(Math.cos((Math.PI * tb) / 0.22)) : 1;
    const open = clamp01((t - M.olho) / 0.2) * blink;
    const card = inn(t, M.teto - 0.06, 0.4, 0.6, 1.6);
    return (
      <AbsoluteFill style={{ opacity: fo }}>
        {br.al > 0 && (
          <At x={540} y={330} sc={br.sc} al={br.al}>
            <div style={{ width: 720, background: DK.card, border: `3px solid ${C.coral}`, borderRadius: 30, padding: "16px 28px", boxSizing: "border-box", fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.22, color: DK.text, letterSpacing: "-0.015em", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
              Cobrou mais, faturou mais.<br />
              <span style={{ color: C.coral }}>E o MEI tem teto.</span>
            </div>
          </At>
        )}
        {ph > 0 && (
          <>
            <At x={px} y={py} rot={lerp(-12, -4, outCubic(ph)) + ((px - 318) / 222) * 4}>
              <Phone w={280} />
            </At>
            <At x={px} y={py + 344} al={clamp01((ph - 0.5) * 3)}>
              <div style={{ background: DK.alt, borderRadius: 30, padding: "9px 22px", fontFamily: FONT, fontWeight: 700, fontSize: 22, color: DK.text2, letterSpacing: "0.14em", whiteSpace: "nowrap" }}>APP EM CONSTRUÇÃO</div>
            </At>
          </>
        )}
        {eye.al > 0 && (
          <At x={760} y={590 + Math.sin(t * 2.4) * 6} sc={eye.sc} al={eye.al}>
            <Eye open={open} w={220} look={t > M.teto ? 0.25 : 0} />
          </At>
        )}
        {card.al > 0 && (
          <At x={738} y={880} sc={0.92 * card.sc * (1 + spring(t, M.n81 - 0.02, 0.06, 2.4, 6))} al={card.al}>
            <TetoCard fill={clamp01((t - (M.teto + 0.05)) / 0.9)} val={clamp01((t - (M.n81 - 0.06)) / 0.25)} />
          </At>
        )}
      </AbsoluteFill>
    );
  }
  const ic = inn(t, M.comenta - 0.14, 0.4, 0.3, 2);
  const at = inn(t, M.voce2 - 0.1, 0.32, 0.6, 1.8);
  return (
    <>
      {ic.al > 0 && (
        <At x={540} y={500 + Math.sin(t * 2.6) * 7} sc={ic.sc} al={ic.al} rot={-4 + spring(t, M.comenta, 6, 2.2, 5)}>
          <CommentIcon t={t} w={260} />
        </At>
      )}
      {[0, 1, 2].map((j) => {
        const p = inn(t, M.quais + 0.14 * j, 0.32, 0.4, 2.2);
        if (p.al <= 0) return null;
        const bob = Math.sin((t - M.quais) * 3.4 + j * 1.2) * 7;
        const jump = spring(t, M.tem + 0.08 * j, -55, 1.6, 5);
        return (
          <At key={j} x={250 + 290 * j} y={800 + bob + jump} sc={p.sc} al={p.al}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <NumDot n={j + 1} size={120} />
              <Pill size={29}>{ROT[j]}</Pill>
            </div>
          </At>
        );
      })}
      {at.al > 0 && (
        <At x={540} y={1030} sc={at.sc} al={at.al}>
          <Pill size={36} color={C.ink2}>@legalizai.app</Pill>
        </At>
      )}
    </>
  );
};

export const Broll: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const endP = clamp01((t - END0) / (TI.dur - END0));
  const endIn: React.CSSProperties = endP > 0
    ? { translate: `${((1 - inOutCubic(endP)) * 1080).toFixed(1)}px 0px`, filter: `blur(${(Math.sin(Math.PI * endP) * 16).toFixed(2)}px)` }
    : {};
  const trs = SEG.map((_, k) => trOf(k, t));
  // clarão branco nos cortes do tipo flash
  let flash = 0;
  BND.forEach((b, k) => {
    if (KIND[k] !== "flash") return;
    if (t >= b - 0.08 && t < b) flash = Math.max(flash, (t - (b - 0.08)) / 0.08);
    if (t >= b && t < b + 0.2) flash = Math.max(flash, 1 - (t - b) / 0.2);
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#15171C" }}>
      {SEG.map((_, k) =>
        trs[k].hide ? null : (
          <AbsoluteFill key={`v${k}`} style={{ zIndex: trs[k].z, ...trs[k].style }}>
            <Video k={k} t={t} />
          </AbsoluteFill>
        ),
      )}
      {endP > 0 && (
        <AbsoluteFill style={{ zIndex: 120, ...endIn }}>
          <Video k={0} t={0} frame={0} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ zIndex: 150, background: SCRIM }} />
      {SEG.map((_, k) =>
        trs[k].hide ? null : (
          <AbsoluteFill key={`o${k}`} style={{ zIndex: 160 + trs[k].z, ...trs[k].style, filter: undefined }}>
            <Over k={k} t={t} />
          </AbsoluteFill>
        ),
      )}
      {endP > 0 && (
        <AbsoluteFill style={{ zIndex: 290, ...endIn, filter: undefined }}>
          <HookTitle t={0} still />
        </AbsoluteFill>
      )}
      {flash > 0 && <AbsoluteFill style={{ zIndex: 295, background: "#fff", opacity: 0.85 * flash }} />}
      <AbsoluteFill style={{ zIndex: 300, opacity: 1 - clamp01((t - END0) / 0.2) }}>
        <AppleCaptions tl={TI} top={1180} height={300} size={68} skip={[0]} mode={() => "video"} left={90} width={860} />
      </AbsoluteFill>
      <Audio src={staticFile("mix-broll.wav")} />
    </AbsoluteFill>
  );
};
