// Reel "Cinco motivos" de 40 s no estilo do pin "Animated motion ads" (13/10/2026): fundo claro, um círculo tracejado
// com grade de pontos no meio (o palco), um recorte por motivo dentro dele (argila 3D da marca, do Higgsfield, sem
// fundo), cantos de colagem fixos (a mão com o cartão do CNPJ, as moedas com o celular), título numerado no alto
// ("1." coral + palavra) que entra digitando e a fala de cada tomada embaixo do círculo. Na troca de motivo o recorte
// velho voa com zoom e o novo desliza girando com overshoot, tudo com motion blur. No convite, setas coral varrem a
// tela até a pílula LINK DA BIO; no fecho, "Vai, Legalizaí". Som: o do After Effects pelo MCP (take40.sh).
import React from "react";
import { AbsoluteFill, Img, getRemotionEnvironment, staticFile, useCurrentFrame } from "remotion";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/fonts";
import DADOS from "./estacoes40.json";

const TOM = (DADOS as unknown as { estacoes: { n: number; de: number; ate: number }[] }).estacoes;
const de = (n: number) => TOM[n - 1].de;
const ate = (n: number) => TOM[n - 1].ate;
const FI = (DADOS as unknown as { fecho: number }).fecho;
const C = { papel: "#FAF8F5", borda: "#ECE8E2", tinta: "#15171C", cinza: "#8E939C", coral: "#F2643C", ponto: "#CFC8BD" };

let fontes = false;
const pedeFontes = () => {
  if (fontes) return;
  fontes = true;
  loadFont({ family: "Sora", url: staticFile("Sora-wght.ttf"), weight: "100 800" });
  loadFont({ family: "DM Serif Display", url: staticFile("fontes/DMSerifDisplay-Italic.ttf"), style: "italic", weight: "400" });
};

const cl = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const eOut = (x: number) => 1 - Math.pow(1 - x, 3);
const eIn = (x: number) => x * x * x;
const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x: number, s = 1.7) => { const y = x - 1; return 1 + (s + 1) * y * y * y + s * y * y; };

// ---------- seções: o que fica no círculo e o título numerado ----------
type Secao = { a: number; b: number; img?: string; num?: string; titulo?: string; cinco?: boolean; celular?: boolean; pilula?: boolean; fecho?: boolean };
const SEC: Secao[] = [
  { a: 0, b: de(3), img: "recortes40/gancho.png" },
  { a: de(3), b: de(5), cinco: true },
  { a: de(5), b: de(11), img: "recortes40/calendario.png", num: "1.", titulo: "MEI" },
  { a: de(11), b: de(15), img: "recortes40/bolso.png", num: "2.", titulo: "Microempresa" },
  { a: de(15), b: de(19), img: "recortes40/praia.png", num: "3.", titulo: "Salário de dono" },
  { a: de(19), b: de(21), celular: true, num: "4.", titulo: "O app" },
  { a: de(21), b: de(24), img: "recortes40/aperto.png", num: "5.", titulo: "Abertura" },
  { a: de(24), b: FI - 3, pilula: true },
  { a: FI - 3, b: 1200, fecho: true },
];

// a fala de cada tomada embaixo do círculo (sem repetir o título): [tomada, partes]; parte = [texto, estilo]
type Parte = [string, "forte" | "leve" | "serif" | "coral" | "numero"];
const LEG: [number, Parte[]][] = [
  [2, [["no", "forte"], ["CPF?", "coral"]]],
  [4, [["pra ter", "forte"], ["CNPJ.", "coral"]]],
  [6, [["a guia é", "forte"], ["fixa.", "coral"]]],
  [7, [["Fature de", "forte"], ["R$ 1", "numero"]]],
  [8, [["até o teto de", "forte"], ["R$ 81 mil", "numero"], ["por ano", "serif"]]],
  [9, [["exatamente", "coral"]]],
  [10, [["R$ 6.750", "numero"], ["por mês", "serif"]]],
  [12, [["que começa em", "forte"], ["6%", "numero"]]],
  [13, [["de R$ 10 mil,", "forte"], ["R$ 600", "numero"], ["de imposto", "serif"]]],
  [14, [["R$ 9.400", "numero"], ["no bolso.", "coral"]]],
  [15, [["na microempresa,", "forte"]]],
  [17, [["recolhe", "forte"], ["INSS", "numero"]]],
  [18, [["pra sua", "forte"], ["aposentadoria.", "coral"]]],
  [19, [["calcula.", "coral"]]],
  [20, [["Você emite a nota", "forte"], ["e paga.", "coral"]]],
  [22, [["é com a", "forte"], ["gente,", "coral"]]],
  [23, [["sem", "forte"], ["honorário.", "coral"]]],
  [24, [["clique no", "forte"], ["link da bio", "coral"]]],
  [25, [["entre na", "forte"], ["lista de espera", "coral"], ["do app que tá chegando.", "leve"]]],
];

// telas do app que entram em colagem na borda do círculo
const TELAS: { tom: number; src: string; x: number; y: number; giro: number }[] = [
  { tom: 16, src: "telas40/12-tela-pro-labore.png", x: 232, y: 1030, giro: -6 },
  { tom: 20, src: "telas40/11-tela-emitir-nota.png", x: 848, y: 1030, giro: 6 },
];

const CX = 540, CY = 1000, R = 340;

// troca no círculo: o recorte entra deslizando da direita e girando, com overshoot; sai crescendo e girando, acelerando
const entrada = (f: number, a: number) => { const k = cl((f - a) / 13); return { x: lerp(760, 0, eOut(k)), giro: lerp(16, 0, eOut(k)), s: lerp(0.7, 1, eBack(k)), o: cl(k * 3) }; };
const saida = (f: number, b: number) => { const k = cl((f - (b - 8)) / 8); return { s: 1 + 0.45 * eIn(k), giro: -10 * eIn(k), o: 1 - eIn(k), y: -40 * eIn(k) }; };

const abre = (f: number) => TELAS.reduce((x, t) => {
  const k = eInOut(cl((f - de(t.tom)) / 10)) * (1 - eInOut(cl((f - ate(t.tom)) / 10)));
  return x + (t.x < CX ? 130 : -130) * k;
}, 0);
const Recorte: React.FC<{ s: Secao; f: number; fr: number }> = ({ s, f, fr }) => {
  const en0 = entrada(f, s.a), sa = saida(f, s.b), en = { ...en0, x: en0.x + abre(f) };
  const flut = Math.sin((f / 30) * 1.6 + s.a) * 10;
  const base: React.CSSProperties = {
    position: "absolute", left: CX, top: CY, transform: `translate(-50%, -50%) translate(${en.x}px, ${flut + sa.y}px) rotate(${en.giro + sa.giro + Math.sin(f / 40 + s.a) * 1.5}deg) scale(${en.s * sa.s})`,
    opacity: en.o * sa.o,
  };
  if (s.img) return <Img src={staticFile(s.img)} style={{ ...base, width: 580, height: 580, objectFit: "contain", filter: "drop-shadow(0px 30px 34px rgba(21,23,28,0.22))" }} />;
  if (s.celular) {
    const i = Math.min(461, Math.max(0, fr - s.a));
    return <Img src={staticFile(`cel17v7/cel_${String(i).padStart(4, "0")}.png`)} style={{ ...base, width: 480, height: 720, filter: "drop-shadow(0px 26px 30px rgba(21,23,28,0.25))" }} />;
  }
  if (s.cinco) return <div style={{ ...base, fontFamily: "Sora", fontWeight: 800, fontSize: 470, lineHeight: 1, color: C.coral, letterSpacing: "-0.04em", textShadow: "0 26px 40px rgba(221,78,39,0.25)" }}>5</div>;
  if (s.pilula) {
    const k = cl((f - s.a - 3) / 9);
    return (
      <div style={{ ...base, transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * eBack(k)) * sa.s}) rotate(${-4 * (1 - eOut(k))}deg)`, width: 600, height: 150, borderRadius: 75, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 44px rgba(221,78,39,0.35)" }}>
        <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 78, letterSpacing: "0.04em", color: "#FFFFFF", lineHeight: 1 }}>LINK DA BIO</span>
      </div>
    );
  }
  return null;
};

// o texto digitando: letra a letra, sem desfoque
const Digita: React.FC<{ txt: string; f: number; a: number; style: React.CSSProperties; vel?: number }> = ({ txt, f, a, style, vel = 1.6 }) => {
  const n = Math.floor(cl((f - a) / Math.max(1, txt.length / vel)) * txt.length + 0.0001);
  return <span style={style}>{txt.slice(0, Math.max(0, n))}<span style={{ opacity: 0 }}>{txt.slice(Math.max(0, n))}</span></span>;
};

const Titulo: React.FC<{ s: Secao; f: number }> = ({ s, f }) => {
  if (!s.num) return null;
  const sa = saida(f, s.b), k = cl((f - s.a) / 6);
  return (
    <div style={{ position: "absolute", left: 120, top: 410, transform: `translateY(${lerp(30, 0, eOut(k)) + sa.y * 2}px)`, opacity: cl(k * 2) * sa.o, whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 150, color: C.coral, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.num}</span>
      <Digita txt={" " + s.titulo} f={f} a={s.a + 3} style={{ fontFamily: "Sora", fontWeight: 800, fontSize: s.titulo!.length > 9 ? 96 : 130, color: C.tinta, letterSpacing: "-0.03em", lineHeight: 1 }} />
    </div>
  );
};

// o gancho e a abertura: a frase grande no alto, à esquerda, como o "Your Brand / Is NOT"
const Gancho: React.FC<{ f: number }> = ({ f }) => {
  const b3 = de(3), sa1 = saida(f, b3), b5 = de(5), sa2 = saida(f, b5);
  return (
    <>
      {f < b3 && (
        <div style={{ position: "absolute", left: 120, top: 400, opacity: sa1.o, transform: `translateY(${sa1.y * 2}px)` }}>
          <div><Digita txt="Ainda recebe pelo" f={f} a={2} vel={2.2} style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 64, color: C.cinza, letterSpacing: "-0.02em", lineHeight: 1.1 }} /></div>
          <div><Digita txt="seu trabalho" f={f} a={18} vel={2} style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 120, color: C.tinta, letterSpacing: "-0.035em", lineHeight: 1.05 }} /></div>
        </div>
      )}
      {f >= b3 && f < b5 && (
        <div style={{ position: "absolute", left: 120, top: 420, opacity: sa2.o, transform: `translateY(${sa2.y * 2}px)` }}>
          <Digita txt="motivos" f={f} a={b3 + 2} vel={1.6} style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 130, color: C.tinta, letterSpacing: "-0.035em", lineHeight: 1.05 }} />
        </div>
      )}
    </>
  );
};

const estilo = (e: Parte[1]): React.CSSProperties => {
  if (e === "numero") return { fontFamily: "Sora", fontWeight: 800, fontSize: 92, color: C.tinta, letterSpacing: "-0.03em" };
  if (e === "coral") return { fontFamily: "DM Serif Display", fontStyle: "italic", fontSize: 92, color: C.coral };
  if (e === "serif") return { fontFamily: "DM Serif Display", fontStyle: "italic", fontSize: 76, color: C.cinza };
  if (e === "leve") return { fontFamily: "Sora", fontWeight: 800, fontSize: 44, color: C.cinza, letterSpacing: "-0.01em" };
  return { fontFamily: "Sora", fontWeight: 800, fontSize: 60, color: C.tinta, letterSpacing: "-0.02em" };
};

const Legenda: React.FC<{ f: number }> = ({ f }) => {
  const atual = LEG.find(([n]) => f >= de(n) && f < ate(n));
  if (!atual) return null;
  const [n, partes] = atual, a = de(n), b = ate(n);
  const sai = cl((f - (b - 5)) / 5);
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 1392, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: 22, rowGap: 4, opacity: 1 - eIn(sai), transform: `translateY(${-24 * eIn(sai)}px)` }}>
      {partes.map(([t, e], i) => {
        const k = cl((f - (a + i * 3)) / 7);
        return <span key={i} style={{ ...estilo(e), lineHeight: 1.1, whiteSpace: "nowrap", display: "inline-block", opacity: k > 0 ? 1 : 0, transform: `translateY(${lerp(26, 0, eOut(k))}px) scale(${0.85 + 0.15 * eBack(k)})` }}>{t}</span>;
      })}
    </div>
  );
};

// cantos: a mão (argila) com o cartão do CNPJ no alto à direita; moedas e o celular embaixo à direita
const Cantos: React.FC<{ f: number; fr: number }> = ({ f, fr }) => {
  const fim = cl((f - (FI - 8)) / 8), ent1 = eOut(cl((f - 20) / 14)), ent2 = eOut(cl((f - 34) / 14));
  const fl = (q: number) => Math.sin((f / 30) * 1.2 + q) * 9;
  return (
    <>
      <div style={{ position: "absolute", left: 540, top: 40, width: 420, height: 420, opacity: 1 - eIn(fim), transform: `translate(${lerp(420, 0, ent1) + 300 * eIn(fim)}px, ${lerp(-300, 0, ent1) + fl(0)}px) rotate(${-6 + Math.sin(f / 50) * 2}deg)` }}>
        <Img src={staticFile("recortes40/mao.png")} style={{ position: "absolute", inset: 0, width: 420, height: 420, objectFit: "contain", filter: "drop-shadow(0px 24px 26px rgba(21,23,28,0.2))" }} />
        <div style={{ position: "absolute", left: 100, top: 205, width: 334, height: 96, borderRadius: 16, whiteSpace: "nowrap", background: "#FFFFFF", boxShadow: "0 10px 24px rgba(21,23,28,0.14)", display: "flex", alignItems: "center", gap: 14, padding: "0 18px", transform: "rotate(-4deg)" }}>
          <svg width={44} height={44} viewBox="0 0 44 44"><rect width={44} height={44} rx={10} fill={C.coral} /><path d="M11 23 L19 31 L33 14" stroke="#FFFFFF" strokeWidth={5.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 22, color: C.cinza, letterSpacing: "0.06em" }}>CNPJ</span>
            <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 21, color: C.tinta }}>54.321.000/0001-09</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 700, top: 1560, width: 460, height: 460, opacity: 1 - eIn(fim), transform: `translate(${lerp(380, 0, ent2) + 300 * eIn(fim)}px, ${lerp(300, 0, ent2) + fl(2)}px) rotate(${8 + Math.sin(f / 45) * 2}deg)` }}>
        <Img src={staticFile("recortes40/moedas.png")} style={{ position: "absolute", left: -40, top: 140, width: 360, height: 360, objectFit: "contain", filter: "drop-shadow(0px 20px 22px rgba(21,23,28,0.18))" }} />
        <Img src={staticFile(`cel17v7/cel_${String(Math.min(461, 140 + (fr % 40))).padStart(4, "0")}.png`)} style={{ position: "absolute", left: 150, top: -10, width: 300, height: 450, transform: "rotate(-14deg)", filter: "drop-shadow(0px 20px 24px rgba(21,23,28,0.22))" }} />
      </div>
    </>
  );
};

// convite: setas coral grossas varrendo a tela de baixo à esquerda pra cima à direita, atrás do círculo
const Setas: React.FC<{ f: number }> = ({ f }) => {
  const a = de(24) + 6, fim = FI - 3;
  if (f < a || f > fim) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = cl((f - (a + i * 7)) / 26), o = 1 - cl((f - (fim - 8)) / 8);
        const x = lerp(-700, 1300, eInOut(k)), y = lerp(2300, -500, eInOut(k));
        return (
          <svg key={i} width={420} height={420} viewBox="0 0 100 100" style={{ position: "absolute", left: x - 210 + i * 170, top: y - 210 + i * 130, opacity: o * (i === 1 ? 1 : 0.85), transform: "rotate(-45deg)" }}>
            <path d="M8 58 L62 58 L62 80 L94 50 L62 20 L62 42 L8 42 Z" fill={i === 1 ? C.coral : C.tinta} />
          </svg>
        );
      })}
    </>
  );
};

const Fecho: React.FC<{ f: number }> = ({ f }) => {
  const a = FI - 3;
  if (f < a) return null;
  const s = 0.6 + 0.4 * eBack(cl((f - a) / 9)), ai = cl((f - (FI + 28)) / 4), tp = FI + 38;
  const W = 198, X0 = 540 - (W + 28 + 590) / 2;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "540px 920px", transform: `scale(${s})` }}>
        <div style={{ position: "absolute", left: X0, top: 926, transform: "translateY(-50%)", fontFamily: "Sora", fontWeight: 800, fontSize: 106, letterSpacing: "-0.035em", lineHeight: 1, color: C.tinta, whiteSpace: "nowrap" }}>Vai,</div>
        <Img src={staticFile("marca/logo-ai-tinta.svg")} style={{ position: "absolute", left: X0 + W + 28, top: 920 - 58, width: 590 }} />
        <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: X0 + W + 28, top: 920 - 58, width: 590, opacity: ai }} />
      </div>
      {f >= tp && (
        <div style={{ position: "absolute", left: 540 - 165, top: 1060, width: 330, height: 70, borderRadius: 35, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * eBack(cl((f - tp) / 8))})`, boxShadow: "0 12px 26px rgba(221,78,39,0.28)" }}>
          <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 34, letterSpacing: "0.06em", color: "#FFFFFF", lineHeight: 1 }}>LINK DA BIO</span>
        </div>
      )}
    </>
  );
};

const Cena: React.FC<{ fr: number }> = ({ fr }) => {
  const f = useCurrentFrame();
  // o palco: o círculo gira devagar, pulsa a cada troca e encolhe no fecho
  const troca = SEC.reduce((m, s) => (f >= s.a ? s.a : m), 0);
  const pulso = 1 + 0.05 * Math.sin(Math.PI * cl((f - troca) / 10));
  const some = cl((f - (FI - 8)) / 10);
  const esc = pulso * (1 - 0.25 * eInOut(some)), opC = 1 - eInOut(some);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 48%, ${C.papel} 0%, ${C.papel} 45%, ${C.borda} 100%)` }}>
      <Setas f={f} />
      <div style={{ position: "absolute", left: CX - R, top: CY - R, width: 2 * R, height: 2 * R, transform: `scale(${esc})`, opacity: opC }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", overflow: "hidden", backgroundImage: `radial-gradient(circle, ${C.ponto} 0px, ${C.ponto} 2.2px, rgba(207,200,189,0) 2.8px)`, backgroundSize: "26px 26px", backgroundPosition: `${(f * 0.4) % 26}px ${(f * 0.25) % 26}px`, opacity: 0.8 }} />
        <svg width={2 * R} height={2 * R} style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${f * 0.4}deg)` }}>
          <circle cx={R} cy={R} r={R - 3} fill="none" stroke={C.tinta} strokeWidth={3.5} strokeDasharray="11 10" />
        </svg>
      </div>
      {SEC.filter((s) => f >= s.a - 1 && f < s.b + 1).map((s, i) => <Recorte key={i} s={s} f={f} fr={fr} />)}
      {TELAS.map((t, i) => {
        if (f < de(t.tom) || f >= ate(t.tom) + 10) return null;
        const k = cl((f - de(t.tom)) / 10), o = 1 - cl((f - ate(t.tom)) / 10);
        return <Img key={i} src={staticFile(t.src)} style={{ position: "absolute", left: t.x - 132, top: t.y - 286, width: 264, height: 572, borderRadius: 22, opacity: o, boxShadow: "0 24px 44px rgba(21,23,28,0.22)", transform: `translateY(${lerp(120, 0, eOut(k)) - 60 * (1 - o)}px) rotate(${t.giro * eBack(k)}deg) scale(${0.7 + 0.3 * eBack(k)})` }} />;
      })}
      <Gancho f={f} />
      {SEC.map((s, i) => f >= s.a && f < s.b + 1 && <Titulo key={i} s={s} f={f} />)}
      <Legenda f={f} />
      <Cantos f={f} fr={fr} />
      <Fecho f={f} />
    </AbsoluteFill>
  );
};

export const Cinco40Colagem: React.FC = () => {
  pedeFontes();
  const fr = useCurrentFrame();
  const { isRendering } = getRemotionEnvironment();
  return isRendering ? (
    <HtmlInCanvasMotionBlur width={1080} height={1920} samples={8} shutterAngle={200}>
      <Cena fr={fr} />
    </HtmlInCanvasMotionBlur>
  ) : (
    <Cena fr={fr} />
  );
};
