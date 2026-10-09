// Reel "Cinco motivos pra ter CNPJ" (09/10/2026), versão Remotion: a v2 do AE refeita a pedido do Pedro.
// O que mudou da v2: nenhuma letra entra com desfoque, fade ou deslize; tudo mais rápido (entradas de ~0,25 s com
// passada, saídas de 0,16 s); motion blur (HtmlInCanvasMotionBlur) em tudo o que se mexe; sem a barra de progresso;
// os números dos motivos grandes, num trilho à esquerda que rola de um pro outro.
// Regras que continuam: margem de segurança (96 px dos lados, 240 do topo, 360 da base), visto = símbolo da marca,
// legenda em blocos de 3 a 4 palavras com a ênfase na DM Serif Display Italic, nada atravessa nada, valor do DAS do
// MEI nunca aparece (F063), uma animação por frase.
// Tempos: legenda.json (gravado pelo cinco-motivos-ae/legenda-remotion.mjs a partir do legenda-tempos.json do AE).
// Public: public-cinco (links pros arquivos de cinco-motivos-ae e sufoco-linha-ae).
import React from "react";
import { AbsoluteFill, Img, getRemotionEnvironment, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { HtmlInCanvasMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/fonts";
import LEG from "./legenda.json";

export const FPS_CINCO = 30;
export const QUADROS_CINCO = 1299; // 43,3 s, o tamanho do mix
const FPS = FPS_CINCO;

// as fontes só carregam quando esta composição renderiza (as outras do projeto usam outros public)
let fontesPedidas = false;
const pedeFontes = () => {
  if (fontesPedidas) return;
  fontesPedidas = true;
  loadFont({ family: "Sora", url: staticFile("Sora-wght.ttf"), weight: "100 800" });
  loadFont({ family: "DM Serif Display", url: staticFile("fontes/DMSerifDisplay-Italic.ttf"), style: "italic", weight: "400" });
};

const C = {
  ink: "#15171C", ink2: "#1D2027", ink3: "#262A33", linha: "#383C48", papel: "#FAF8F5", creme: "#F3EDE4",
  coral: "#F2643C", coral6: "#DD4E27", coral7: "#B83D1C", cinza: "#9AA0AA", cinzaPapel: "#DCD6CE",
};
const Y_LEG = 1480, LARG_LEG = 888;

// ---------- a narração ----------
type Palavra = { t: string; s: number; e: number };
type Bloco = { frase: number; ws: string[]; idx: number[]; ik: number; tin: number; fim: number; chave: number | null };
const WORDS = LEG.words as Palavra[];
const BLOCOS = LEG.blocos as Bloco[];
const nrm = (s: string) => s.replace(/[^\p{L}\p{N}%.]/gu, "").replace(/\.$/, "").toLowerCase();
const S = (txt: string, n = 1) => {
  let c = 0;
  for (const w of WORDS) if (nrm(w.t) === nrm(txt) && ++c === n) return w.s;
  throw new Error("palavra " + txt);
};

// ---------- tempo e curvas (t em segundos) ----------
const cl = (x: number) => Math.min(1, Math.max(0, x));
const pr = (t: number, t0: number, d: number) => cl((t - t0) / d);
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const eOut = (x: number) => 1 - Math.pow(1 - x, 4);
const eIn = (x: number) => x * x * x;
const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x: number, s = 1.45) => {
  const y = x - 1;
  return 1 + (s + 1) * y * y * y + s * y * y;
};

// ---------- peças de desenho ----------
const rr = (cx: number, cy: number, w: number, h: number, r: number) => {
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  return `M ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
};
const circ = (cx: number, cy: number, r: number) => `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`;
const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const P = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [xa, ya] = P(a0), [xb, yb] = P(a1);
  return `M ${xa} ${ya} A ${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${xb} ${yb}`;
};
const ln = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} L ${x2} ${y2}`;
const ponto = (x: number, y: number) => ln(x, y, x, y + 0.1);

type Dir = "baixo" | "cima" | "esq" | "dir" | "zoom" | "slam" | "nada";
type AnimP = {
  t: number; x: number; y: number; t0: number; t1: number; ent?: Dir; sai?: Dir; dist?: number; din?: number;
  dout?: number; esc0?: number; rot0?: number; op?: number; children: React.ReactNode;
};
// entrada seca com passada (sem desfoque nem fade longo: a opacidade chega em 2 quadros) e saída rápida pro lado
const Anim: React.FC<AnimP> = ({ t, x, y, t0, t1, ent = "baixo", sai = "esq", dist = 150, din = 0.26, dout = 0.16, esc0, rot0 = 0, op = 1, children }) => {
  if (t < t0 || t > t1) return null;
  const a = pr(t, t0, din), b = pr(t, t1 - dout, dout);
  const ea = eBack(a), k = 1 - ea;
  let dx = 0, dy = 0;
  if (ent === "baixo") dy += dist * k;
  if (ent === "cima") dy -= dist * k;
  if (ent === "esq") dx -= dist * k;
  if (ent === "dir") dx += dist * k;
  const s0 = esc0 ?? (ent === "slam" ? 1.8 : ent === "zoom" ? 0.35 : 0.84);
  let s = lerp(s0, 1, ea);
  const eb = eIn(b);
  if (sai === "esq") dx -= 240 * eb;
  if (sai === "dir") dx += 240 * eb;
  if (sai === "cima") dy -= 220 * eb;
  if (sai === "baixo") dy += 220 * eb;
  s *= lerp(1, sai === "zoom" ? 0.5 : 0.9, eb);
  const o = op * cl(a / 0.25) * (1 - cl((b - 0.55) / 0.45));
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: `calc(-50% + ${dx}px) calc(-50% + ${dy}px)`, scale: String(s), rotate: `${rot0 * k}deg`, opacity: o }}>
      {children}
    </div>
  );
};

const Texto: React.FC<{ s: string; tam: number; cor: string; dm?: boolean; peso?: number; track?: number; op?: number; sombra?: boolean; tab?: boolean }> = ({ s, tam, cor, dm, peso = 800, track = 0, op = 1, sombra, tab }) => (
  <div
    style={{
      fontFamily: dm ? "DM Serif Display" : "Sora", fontStyle: dm ? "italic" : "normal", fontWeight: dm ? 400 : peso, fontSize: tam,
      color: cor, letterSpacing: `${track / 1000}em`, lineHeight: 1, whiteSpace: "nowrap", opacity: op,
      textShadow: sombra ? "0 8px 26px rgba(0,0,0,0.55)" : undefined, fontVariantNumeric: tab ? "tabular-nums" : undefined,
    }}
  >
    {s}
  </div>
);

// cartão de vidro escuro das referências: corpo, filete claro no topo, contorno fino e sombra
const Cartao: React.FC<{ w: number; h: number; r?: number; children?: React.ReactNode }> = ({ w, h, r = 40, children }) => (
  <div
    style={{
      position: "relative", width: w, height: h, borderRadius: r, background: "rgba(29,32,39,0.94)", border: `2px solid ${C.linha}`,
      boxShadow: "0 22px 60px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.13)", boxSizing: "border-box",
    }}
  >
    {children}
  </div>
);

// o símbolo da marca (identidade/logos/simbolo.svg): quadrado coral com o visto branco, inteiro
const Simbolo: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 211.09 211.09" style={{ display: "block" }}>
    <rect width="211.09" height="211.09" rx="32.84" ry="32.84" fill={C.coral} />
    <path fill="#FFFFFF" d="M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87Z" />
  </svg>
);
const SimboloPop: React.FC<{ t: number; x: number; y: number; tam: number; t0: number; t1: number }> = ({ t, x, y, tam, t0, t1 }) => (
  <Anim t={t} x={x} y={y} t0={t0} t1={t1} ent="zoom" esc0={0} rot0={-28} din={0.24}>
    <Simbolo tam={tam} />
  </Anim>
);

// ícone de traço que se desenha (o Trim Paths do AE): todos os caminhos juntos, de 0 a 1
const Traco: React.FC<{ d: string[]; w: number; h: number; prog: number; cor?: string; larg?: number }> = ({ d, w, h, prog, cor = C.creme, larg = 9 }) => (
  <svg width={w} height={h} viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
    {prog > 0.002 &&
      d.map((dd, i) => (
        <path key={i} d={dd} pathLength={1} fill="none" stroke={cor} strokeWidth={larg} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - cl(prog)} />
      ))}
  </svg>
);

// ---------- o fundo (fora do motion blur: mexe devagar) ----------
const RAIOS = [3.27, 5.62, 10.62, 19.15, 25.81, 30.07, 31.87];
const PARTICULAS = (() => {
  let seed = 11;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: 44 }, () => {
    const s = 4 + Math.round(rnd() * 9), cor = rnd() < 0.55 ? C.coral : C.creme, op = 40 + Math.round(rnd() * 55);
    const x0 = Math.round(rnd() * 1080), y0 = Math.round(rnd() * 1920), vy = 14 + Math.round(rnd() * 36), f = 0.3 + rnd() * 0.9, ph = rnd() * 6.28, amp = 10 + Math.round(rnd() * 34);
    return { s, cor, op, x0, y0, vy, f, ph, amp };
  });
})();

const Fundo: React.FC<{ t: number }> = ({ t }) => {
  const luz = interpolate(t, [0, 3.3, 3.6, 5.6, 40.5, 40.9], [0.34, 0.38, 0.6, 0.46, 0.46, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ax = 230 + Math.sin(t * 0.31) * 140, ay = 520 + Math.cos(t * 0.27) * 120;
  const bx = 900 + Math.cos(t * 0.23) * 160, by = 1500 + Math.sin(t * 0.29) * 140;
  const grade = interpolate(t, [0, 0.4, 40.4, 40.8], [0, 0.09, 0.09, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let raio = 0, escRaio = 0.6;
  for (const r of RAIOS) {
    if (t >= r - 0.08 && t <= r + 0.9) {
      const o = t < r + 0.06 ? pr(t, r - 0.08, 0.14) : 1 - pr(t, r + 0.06, 0.84);
      if (o > raio) {
        raio = o;
        escRaio = lerp(0.6, 1.2, eOut(pr(t, r - 0.08, 0.98)));
      }
    }
  }
  const partOp = pr(t, 0, 0.5) * (1 - pr(t, 40.5, 0.4));
  // a luz coral atrás do celular (cenas 5 a 7)
  const luzCel = interpolate(t, [25.4, 26.0, 40.2, 40.6], [0, 0.32, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cel = posCelular(t);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <AbsoluteFill
        style={{
          opacity: luz, mixBlendMode: "screen",
          background: `radial-gradient(circle at ${ax}px ${ay}px, rgba(242,100,60,0.6) 0px, rgba(242,100,60,0.42) 320px, rgba(242,100,60,0.14) 680px, rgba(242,100,60,0) 980px), radial-gradient(circle at ${bx}px ${by}px, rgba(184,61,28,0.7) 0px, rgba(184,61,28,0.5) 380px, rgba(184,61,28,0.18) 780px, rgba(184,61,28,0) 1120px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: grade,
          backgroundImage: `radial-gradient(circle, ${C.creme} 0px, ${C.creme} 3px, rgba(243,237,228,0) 3.6px)`,
          backgroundSize: "48px 48px", backgroundPosition: `${60 - 24}px ${64 - 24 - ((t * 6) % 48)}px`,
        }}
      />
      {raio > 0.001 && (
        <div
          style={{
            position: "absolute", left: 540 - 1100, top: 820 - 1100, width: 2200, height: 2200, borderRadius: "50%", opacity: raio * 0.42,
            scale: String(escRaio), rotate: `${t * 9}deg`, mixBlendMode: "plus-lighter", filter: "blur(22px)",
            background: `repeating-conic-gradient(from 0deg, ${C.coral} 0deg 5deg, rgba(242,100,60,0) 7deg 20deg)`,
            WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 70%)",
          }}
        />
      )}
      {luzCel > 0.001 && (
        <div style={{ position: "absolute", left: cel.x - 520, top: cel.y - 700, width: 1040, height: 1400, opacity: luzCel, background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(242,100,60,1) 0%, rgba(242,100,60,0.55) 35%, rgba(242,100,60,0) 72%)" }} />
      )}
      <AbsoluteFill style={{ opacity: partOp }}>
        {PARTICULAS.map((q, i) => {
          const y = (((q.y0 - t * q.vy) % 1980) + 1980) % 1980 - 30;
          const x = q.x0 + Math.sin(t * q.f + q.ph) * q.amp;
          const o = (q.op / 100) * (0.55 + 0.45 * Math.sin(t * q.f * 2.3 + q.ph));
          return <div key={i} style={{ position: "absolute", left: x - q.s / 2, top: y - q.s / 2, width: q.s, height: q.s, borderRadius: "50%", background: q.cor, opacity: o, boxShadow: `0 0 ${q.s * 2}px ${q.cor}` }} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- cena 0: o gancho ("Ainda recebe pelo seu trabalho no CPF?") ----------
const ICONE_ID = [rr(0, 0, 420, 260, 34), circ(-118, -20, 46), arco(-118, 88, 76, 200, 340), ln(10, -60, 160, -60), ln(10, -10, 130, -10), ln(10, 40, 160, 40)];
const Gancho: React.FC<{ t: number }> = ({ t }) => {
  const t0 = 0.05, t1 = 3.2, tc = S("CPF") - 0.06; // sai colado no "5" (3,22), sem quadro vazio
  if (t < t0 || t > t1) return null;
  return (
    <>
      <Anim t={t} x={540} y={830} t0={t0} t1={t1} ent="zoom" esc0={0.7} din={0.3} sai="cima">
        <Cartao w={820} h={600} r={44}>
          <div style={{ position: "absolute", left: 410 - 220, top: 300 - 90 - 140 }}>
            <Traco d={ICONE_ID} w={440} h={280} prog={eInOut(pr(t, 0.3, 0.75))} larg={10} />
          </div>
        </Cartao>
      </Anim>
      {/* "CPF" bate grande no "CPF?" e o ponto de interrogação gira pra dentro */}
      <Anim t={t} x={500} y={1010} t0={tc} t1={t1} ent="slam" esc0={1.9} din={0.22} sai="cima">
        <Texto s="CPF" tam={190} cor={C.papel} track={40} />
      </Anim>
      <Anim t={t} x={762} y={1010} t0={S("CPF") + 0.18} t1={t1} ent="zoom" esc0={0.2} rot0={-35} din={0.24} sai="cima">
        <Texto s="?" tam={230} cor={C.coral} dm />
      </Anim>
    </>
  );
};

// ---------- cena 1: "Cinco motivos pra ter CNPJ." ----------
const Abertura: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Cinco") - 0.05, t1 = 5.55;
  if (t < t0 || t > t1) return null;
  return (
    <>
      <Anim t={t} x={540} y={760} t0={t0} t1={t1} ent="slam" esc0={2.3} rot0={-10} din={0.24} sai="cima">
        <Texto s="5" tam={560} cor={C.coral} />
      </Anim>
      <Anim t={t} x={540} y={1075} t0={S("motivos") - 0.04} t1={t1} ent="dir" dist={280} din={0.24} sai="cima">
        <Texto s="motivos" tam={150} cor={C.papel} dm />
      </Anim>
      <Anim t={t} x={540} y={1195} t0={S("pra") - 0.02} t1={t1} ent="esq" dist={280} din={0.24} sai="cima">
        <Texto s="pra ter CNPJ" tam={66} cor={C.creme} peso={700} op={0.82} />
      </Anim>
    </>
  );
};

// ---------- o trilho dos números (no lugar da barra e do selo): o número grande à esquerda, que rola ----------
const TR = { x: 96, y: 244, w: 500, h: 480 };
const TROCAS = [S("Um") - 0.08, S("Dois") - 0.08, S("Três") - 0.08, S("Quatro") - 0.08, S("Cinco", 2) - 0.08, 33.42];
const NUMEROS = ["", "1", "2", "3", "4", "5", ""];
const slotDo = (t: number) => TROCAS.reduce((v, tt) => v + eBack(pr(t, tt, 0.36), 0.7), 0);
const PASSO = 660; // distância entre os números na faixa, maior que a janela: o vizinho (e o eco dele) nunca aparece
const Trilho: React.FC<{ t: number }> = ({ t }) => {
  if (t < TROCAS[0] || t > TROCAS[5] + 0.4) return null;
  const faixa = (v: number, eco: boolean) => (
    <div style={{ position: "absolute", left: 0, top: 0, translate: `0px ${-v * PASSO}px` }}>
      {NUMEROS.map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: 0, top: i * PASSO, width: TR.w, height: TR.h, display: "flex", alignItems: "center", justifyContent: "flex-start",
            fontFamily: "Sora", fontWeight: 800, fontSize: 600, lineHeight: 1, letterSpacing: "-0.04em",
            ...(eco
              ? { color: "rgba(0,0,0,0)", WebkitTextStroke: "3px rgba(250,248,245,0.34)", translate: "16px 16px" }
              : { color: C.coral, textShadow: "0 18px 50px rgba(0,0,0,0.45)" }),
          }}
        >
          <span style={{ display: "block", translate: "-6px 14px" }}>{n}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: TR.x, top: TR.y, width: TR.w, height: TR.h, overflow: "hidden" }}>
      {faixa(slotDo(t - 0.05), true)}
      {faixa(slotDo(t), false)}
    </div>
  );
};

// ---------- cena 2: motivo 1 ("no MEI, a guia é fixa, fature 500 ou 5 mil") ----------
const GuiaPapel: React.FC = () => (
  <div style={{ position: "relative", width: 280, height: 370, borderRadius: 26, background: C.papel, boxShadow: "0 26px 70px rgba(0,0,0,0.6)" }}>
    <div style={{ position: "absolute", left: 30, top: 30, width: 220, height: 30, borderRadius: 10, background: C.coral }} />
    {[[96, 150], [132, 190], [168, 130], [204, 170]].map(([y, w], i) => (
      <div key={i} style={{ position: "absolute", left: 30, top: y, width: w, height: 14, borderRadius: 7, background: C.cinzaPapel }} />
    ))}
    {Array.from({ length: 17 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: 32 + i * 13, top: 282, width: i % 3 === 0 ? 7 : 4, height: 52, background: C.ink, opacity: 0.85 }} />
    ))}
  </div>
);
const CADEADO = ["M -15 -4 V -13 A 15 15 0 0 1 15 -13 V -4", rr(0, 12, 50, 38, 9)];
const Motivo1: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Um") - 0.03, t1 = 10.52;
  if (t < t0 || t > t1) return null;
  const tg = S("MEI") - 0.05, tf = S("fixa") - 0.05, t5 = S("500") - 0.05, tm = S("5") - 0.05;
  // o faturamento corre de 500 pra 5 mil e a guia não muda: o cadeado só confirma quando ele chega
  const kn = eInOut(pr(t, tm, 0.32));
  const kx = lerp(230, 830, kn);
  const confirma = t > tm + 0.3 ? Math.sin(pr(t, tm + 0.3, 0.26) * Math.PI) : 0;
  return (
    <>
      <Anim t={t} x={770} y={470} t0={tg} t1={t1} ent="baixo" dist={200} rot0={14} din={0.3}>
        <div style={{ scale: String(1 + 0.03 * confirma) }}>
          <GuiaPapel />
        </div>
      </Anim>
      <Anim t={t} x={892} y={316} t0={tf} t1={t1} ent="zoom" esc0={0.15} rot0={-40} din={0.26}>
        <div style={{ width: 112, height: 112, borderRadius: 56, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 + 0.16 * confirma), boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
          <Traco d={CADEADO} w={60} h={64} prog={eOut(pr(t, tf + 0.08, 0.26))} cor={C.papel} larg={8} />
        </div>
      </Anim>
      {t >= t5 && (
        <Anim t={t} x={540} y={1000} t0={t5} t1={t1} ent="esq" dist={180} din={0.26}>
          <div style={{ position: "relative", width: 888, height: 220 }}>
            <div style={{ position: "absolute", left: 54, top: 120, width: 780, height: 16, borderRadius: 8, background: C.linha }} />
            <div style={{ position: "absolute", left: 54, top: 120, width: kx - 150, height: 16, borderRadius: 8, background: C.coral }} />
            <div style={{ position: "absolute", left: kx - 96 - 34, top: 128 - 34, width: 68, height: 68, borderRadius: 34, background: C.coral, border: `7px solid ${C.papel}`, boxSizing: "border-box", boxShadow: "0 10px 26px rgba(0,0,0,0.45)" }} />
            <div style={{ position: "absolute", left: kx - 96, top: 30, translate: "-50% 0" }}>
              <Texto s={kn < 0.5 ? "R$ 500" : "R$ 5 mil"} tam={60} cor={C.papel} />
            </div>
            <div style={{ position: "absolute", left: 54, top: 166 }}>
              <Texto s="faturamento" tam={34} cor={C.cinza} peso={600} />
            </div>
          </div>
        </Anim>
      )}
    </>
  );
};

const reais = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;

// ---------- cena 3: motivo 2 ("numa microempresa que começa em 6%, de 10 mil, uns 600 de imposto e uns 9.400 no bolso") ----------
const MALETA = [rr(0, 20, 300, 200, 30), "M -55 -80 V -105 Q -55 -125 -35 -125 H 35 Q 55 -125 55 -105 V -80", ln(-150, 20, 150, 20)];
const Motivo2: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Dois") - 0.03, t1 = 18.85;
  if (t < t0 || t > t1) return null;
  const tm = S("Dois") + 0.35, t6 = S("6%") - 0.08, tb = S("10") - 0.06, t600 = S("600") - 0.1, t94 = S("9.400") - 0.1;
  const BW = 800, FW = BW * 0.06;
  const corta = pr(t, t600, 0.06);
  const cheio = BW * eOut(pr(t, tb, 0.4)) * (1 - 0.06 * corta);
  const fa = eBack(pr(t, t600 + 0.04, 0.38), 1.6);
  return (
    <>
      <Anim t={t} x={770} y={470} t0={tm} t1={t1} ent="zoom" esc0={0.55} din={0.26}>
        <Traco d={MALETA} w={320} h={270} prog={eInOut(pr(t, tm, 0.45))} larg={12} />
      </Anim>
      <Anim t={t} x={540} y={850} t0={t6} t1={t1} ent="slam" esc0={1.9} din={0.22}>
        <Texto s={`${Math.round(lerp(0, 6, pr(t, t6, 0.36)))}%`} tam={260} cor={C.coral} />
      </Anim>
      <Anim t={t} x={540} y={1085} t0={tb - 0.1} t1={t1} ent="dir" dist={200} din={0.26}>
        <div style={{ position: "relative", width: BW, height: 104 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 52, background: C.ink3, border: `2px solid ${C.linha}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: cheio, height: 104, borderRadius: 52, background: C.creme }} />
          {t >= tb + 0.3 && (
            <div style={{ position: "absolute", left: 44, top: 52, translate: "0 -50%", scale: String(lerp(0.6, 1, eBack(pr(t, tb + 0.3, 0.2)))), transformOrigin: "left center" }}>
              <Texto s="R$ 10.000" tam={50} cor={C.ink} />
            </div>
          )}
        </div>
      </Anim>
      {/* a fatia dos 600 sai da ponta da barra e desce */}
      {t >= t600 && (
        <div
          style={{
            position: "absolute", left: lerp(540 + BW / 2 - FW / 2 - 6, 880, fa) - (FW + 12) / 2, top: lerp(1085, 1228, fa) - 52, width: FW + 12, height: 104,
            borderRadius: 20, background: C.coral, rotate: `${-12 * fa}deg`, translate: `${-240 * eIn(pr(t, t1 - 0.16, 0.16))}px 0px`,
            opacity: 1 - cl((pr(t, t1 - 0.16, 0.16) - 0.55) / 0.45), boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
          }}
        />
      )}
      {/* só o número, grande e contando (Pedro, v6: sem o "uns", "deixe apenas o número destacado e com movimento") */}
      <Anim t={t} x={820} y={1338} t0={t600 + 0.25} t1={t1} ent="slam" esc0={1.7} din={0.22}>
        <div style={{ scale: String(1 + 0.08 * Math.sin(Math.PI * pr(t, t600 + 0.7, 0.22))) }}>
          <Texto s={reais(lerp(0, 600, eOut(pr(t, t600 + 0.25, 0.45))))} tam={70} cor={C.coral} tab />
        </div>
      </Anim>
      <Anim t={t} x={130 + 230} y={1232} t0={t94} t1={t1} ent="slam" esc0={1.7} din={0.24}>
        <div style={{ width: 460, display: "flex", scale: String(1 + 0.07 * Math.sin(Math.PI * pr(t, t94 + 0.55, 0.22))), transformOrigin: "left center" }}>
          <Texto s={reais(lerp(0, 9400, eOut(pr(t, t94, 0.55))))} tam={92} cor={C.papel} tab />
        </div>
      </Anim>
      <SimboloPop t={t} x={624} y={1232} tam={84} t0={S("bolso") - 0.05} t1={t1} />
    </>
  );
};

// ---------- cena 4: motivo 3 ("na microempresa, seu salário de dono recolhe INSS pra sua aposentadoria") ----------
const NOTA = [rr(0, 0, 300, 170, 24), circ(0, 0, 42), ln(-118, 0, -100, 0), ln(100, 0, 118, 0)];
const Motivo3: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Três") - 0.03, t1 = 25.18;
  if (t < t0 || t > t1) return null;
  const tp = S("microempresa", 2) - 0.1, ts = S("salário") - 0.1, ti = S("INSS") - 0.06;
  // o painel desce e encolhe pra respirar abaixo do "3" (Pedro, v6: "um respiro no card 3")
  const CX = 540, CY = 1062, CW = 780, CH = 500;
  const COL = 12, LIN = 8, PX = 50, x0 = CX - 20 - ((COL - 1) * PX) / 2, y0 = CY + 192;
  const ALT = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8];
  const tA = S("recolhe") - 0.05, tZ = S("aposentadoria") + 0.25;
  const pontosOp = pr(t, tp + 0.15, 0.1);
  return (
    <>
      <Anim t={t} x={770} y={400} t0={ts} t1={t1} ent="zoom" esc0={0.55} din={0.26}>
        <Traco d={NOTA} w={320} h={190} prog={eInOut(pr(t, ts, 0.42))} larg={11} />
      </Anim>
      <Anim t={t} x={770} y={590} t0={ti} t1={t1} ent="zoom" esc0={0.2} rot0={-10} din={0.24}>
        <div style={{ width: 300, height: 116, borderRadius: 58, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 34px rgba(0,0,0,0.4)" }}>
          <Texto s="INSS" tam={66} cor={C.papel} />
        </div>
      </Anim>
      <Anim t={t} x={CX} y={CY} t0={tp} t1={t1} ent="baixo" dist={200} din={0.28}>
        <Cartao w={CW} h={CH} r={40}>
          {Array.from({ length: COL }, (_, c) =>
            Array.from({ length: LIN }, (_, l) => {
              const px = x0 + c * PX - (CX - CW / 2), py = y0 - l * PX - (CY - CH / 2);
              const aceso = l < ALT[c];
              const tc = tA + ((tZ - tA) * c) / (COL - 1) + l * 0.03;
              const ka = aceso ? eBack(pr(t, tc, 0.14), 2.2) : 0;
              const cor = c >= COL - 2 ? C.papel : C.coral;
              return (
                <React.Fragment key={`${c}-${l}`}>
                  <div style={{ position: "absolute", left: px - 9, top: py - 9, width: 18, height: 18, borderRadius: 9, background: C.creme, opacity: 0.16 * pontosOp }} />
                  {ka > 0.001 && (
                    <div style={{ position: "absolute", left: px - 10, top: py - 10, width: 20, height: 20, borderRadius: 10, background: cor, scale: String(ka), boxShadow: `0 0 14px ${cor === C.coral ? "rgba(242,100,60,0.75)" : "rgba(250,248,245,0.5)"}` }} />
                  )}
                </React.Fragment>
              );
            }),
          )}
        </Cartao>
      </Anim>
      <SimboloPop t={t} x={868} y={862} tam={64} t0={S("aposentadoria") + 0.1} t1={t1} />
    </>
  );
};

// ---------- o celular 3D (sequência PNG do Remotion, com alfa: CelularCinco17, o iPhone 17 Pro Max, 25,2 a 40,6 s) ----------
function posCelular(t: number) {
  // v6: o iPhone 17 Pro Max chega do fundo da tela girando, no próprio 3D (Celular17.tsx); aqui ele só sai pra direita
  const b = eIn(pr(t, 40.12, 0.4));
  return { x: 750 + (1480 - 750) * b, y: 830 + (700 - 830) * b };
}
// fr = o quadro de verdade (fora do motion blur): a imagem é a mesma em todas as amostras e só o deslize borra
const Celular: React.FC<{ t: number; fr: number }> = ({ t, fr }) => {
  if (t < 25.2 || t > 40.62) return null;
  const i = Math.min(461, Math.max(0, fr - 756));
  const { x, y } = posCelular(t);
  const o = pr(t, 25.2, 0.1) * (1 - pr(t, 40.4, 0.2));
  return <Img src={staticFile(`cel17/cel_${String(i).padStart(4, "0")}.png`)} style={{ position: "absolute", left: x - 400, top: y - 600, width: 800, height: 1200, opacity: o }} />;
};

// ---------- cena 5: motivo 4 ("o app calcula. Você emite a nota e paga.") ----------
const CALC = [rr(0, 0, 86, 108, 14), rr(0, -27, 58, 24, 6), ponto(-23, 12), ponto(0, 12), ponto(23, 12), ponto(-23, 35), ponto(0, 35), ponto(23, 35)];
const NOTA_F = [rr(0, 0, 80, 104, 13), ln(-22, -24, 22, -24), ln(-22, 0, 22, 0), ln(-22, 24, 9, 24)];
const BARRAS = [-38, -24, -13, 4, 16, 27, 40].map((x) => ln(x, -36, x, 36));
const Motivo4: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Quatro") - 0.03, t1 = 30.0;
  if (t < t0 || t > t1) return null;
  const X = 290;
  const card = (y: number, tt: number, d: string[]) => (
    <>
      <Anim t={t} x={X} y={y} t0={tt} t1={t1} ent="esq" dist={220} din={0.26}>
        <Cartao w={180} h={180} r={38}>
          <div style={{ position: "absolute", left: 90 - 60, top: 84 - 60 }}>
            <Traco d={d} w={120} h={120} prog={eInOut(pr(t, tt + 0.1, 0.36))} larg={8} />
          </div>
        </Cartao>
      </Anim>
      <SimboloPop t={t} x={X + 58} y={y + 58} tam={46} t0={tt + 0.4} t1={t1} />
    </>
  );
  return (
    <>
      {card(850, S("calcula") - 0.1, CALC)}
      {card(1046, S("nota") - 0.12, NOTA_F)}
      {card(1242, S("paga") - 0.12, BARRAS)}
    </>
  );
};

// ---------- cena 6: motivo 5 ("a abertura é com a gente, sem honorário") ----------
const CONTRATO = [rr(0, 0, 250, 320, 24), ln(-80, -100, 80, -100), ln(-80, -50, 80, -50), ln(-80, 0, 40, 0), ln(-80, 110, -10, 110)];
const Motivo5: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Cinco", 2) - 0.03, t1 = 33.42;
  if (t < t0 || t > t1) return null;
  const ta = S("abertura") - 0.1, tg = S("gente") - 0.06;
  // o carimbo da marca bate no contrato vindo da câmera (sem atravessar o número), e a onda abre
  const onda = pr(t, tg + 0.14, 0.66);
  return (
    <>
      <Anim t={t} x={290} y={1010} t0={ta} t1={t1} ent="zoom" esc0={0.6} din={0.26}>
        <Traco d={CONTRATO} w={270} h={340} prog={eInOut(pr(t, ta, 0.5))} larg={9} />
      </Anim>
      {t >= tg + 0.14 && t <= tg + 0.8 && (
        <div style={{ position: "absolute", left: 290 - 100, top: 1045 - 100, width: 200, height: 200, borderRadius: 100, border: `8px solid ${C.coral}`, boxSizing: "border-box", scale: String(lerp(0.8, 1.6, eOut(onda))), opacity: 1 - onda }} />
      )}
      <Anim t={t} x={290} y={1045} t0={tg} t1={t1} ent="slam" esc0={2.6} din={0.18}>
        <div style={{ filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.45))" }}>
          <Simbolo tam={150} />
        </div>
      </Anim>
    </>
  );
};

// ---------- cena 7: o chamado ("Se você não quer se preocupar com toda a burocracia..., clique no link da bio e entre na lista de espera...") ----------
const Chamado: React.FC<{ t: number }> = ({ t }) => {
  const t0 = S("Se") - 0.05, t1 = 40.5;
  if (t < t0 || t > t1) return null;
  const tbur = S("burocracia"), tc = S("clique") - 0.1, X = 290, Y = 820, te = S("lista") - 0.1, LY = 1110;
  const toques = [S("clique"), S("bio")];
  const aperta = toques.reduce((m, tt) => Math.max(m, t >= tt && t < tt + 0.22 ? Math.sin(pr(t, tt, 0.22) * Math.PI) : 0), 0);
  return (
    <>
      {/* a pilha de papel da burocracia: as folhas caem uma a uma, tremem e voam pra fora no "burocracia" */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ti = t0 + 0.1 + i * 0.28, y = 1040 - i * 26, rz = [-6, 4, -3, 7, -5, 3][i];
        if (t < ti || t > tbur + 1.0) return null;
        const cai = eOut(pr(t, ti, 0.26));
        const voa = eIn(pr(t, tbur + 0.05 + i * 0.04, 0.6));
        const treme = t > tbur - 0.45 && t < tbur + 0.05 ? Math.sin(t * 70 + i) * 3 : 0;
        const x = lerp(X + (i % 2 ? 40 : -40), X, cai) + (-260 - X) * voa;
        const yy = lerp(y - 420, y, cai) + (-360 - i * 60) * voa;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x - 115, top: yy - 75, width: 230, height: 150, borderRadius: 14, background: C.papel, border: `2px solid ${C.cinzaPapel}`,
              boxSizing: "border-box", rotate: `${lerp(rz * 3, rz, cai) - 70 * voa + treme}deg`, opacity: pr(t, ti, 0.06), boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
            }}
          >
            {[35, 65, 95].map((ly) => (
              <div key={ly} style={{ position: "absolute", left: 30, top: ly - 5, width: 150, height: 10, borderRadius: 5, background: C.cinzaPapel }} />
            ))}
          </div>
        );
      })}
      <Anim t={t} x={X} y={Y} t0={tc} t1={t1} ent="zoom" esc0={0.3} din={0.24} sai="nada">
        <div style={{ position: "relative", width: 330, height: 104, borderRadius: 52, background: C.coral6, display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 - 0.08 * aperta), boxShadow: "0 14px 34px rgba(0,0,0,0.4)" }}>
          <Texto s="LINK DA BIO" tam={36} cor={C.papel} track={30} />
          {toques.map((tt, k) =>
            t >= tt && t < tt + 0.55 ? (
              <div key={k} style={{ position: "absolute", left: 165 + 90 - 30, top: 52 + 14 - 30, width: 60, height: 60, borderRadius: 30, background: C.papel, opacity: 0.55 * (1 - pr(t, tt, 0.5)), scale: String(lerp(0.4, 2.6, eOut(pr(t, tt, 0.5)))) }} />
            ) : null,
          )}
        </div>
      </Anim>
      <Anim t={t} x={X} y={LY} t0={te} t1={t1} ent="baixo" dist={160} din={0.26} sai="nada">
        <Cartao w={330} h={250} r={34}>
          {[[55, 150], [125, 190], [195, 120]].map(([y, w], i) => (
            <div key={i} style={{ position: "absolute", left: 105 - 2, top: y - 9 - 2, width: w, height: 18, borderRadius: 9, background: C.cinza, opacity: 0.7 }} />
          ))}
        </Cartao>
      </Anim>
      <SimboloPop t={t} x={X - 115} y={LY - 70} tam={58} t0={S("espera") - 0.05} t1={t1} />
    </>
  );
};

// ---------- cena 8: o fecho padrão dos outros vídeos (kit): "Vai," + logo no papel, o "aí" acende em coral na tônica e
// o LINK DA BIO embaixo. Medidas do src/kit/render/Fecho.tsx e do guia (top 752, gap 28, "Vai," 106 px, logo 590 px,
// pílula em 960). Entra seco, sem o desfoque do kit (pedido do Pedro na v3). ----------
const FECHO_VOZ = 40.9; // o vai-legalizai-dylan.wav no mix; o "Vai" fala a 0,01 s e o "aí" acende a 0,94 s (fecho.json)
const INK_F = "#1B1E24";
const Fecho: React.FC<{ t: number }> = ({ t }) => {
  const tc = 40.45;
  if (t < tc) return null;
  const d = 3000 * eInOut(pr(t, tc, 0.5));
  // o anel coral corre colado do lado de fora da borda do papel e some quando o papel cobre a tela
  const da = d + 34, oa = d > 4 ? 1 - pr(t, tc + 0.32, 0.18) : 0;
  const ta = FECHO_VOZ - 0.04;
  const assina = eBack(pr(t, ta, 0.3), 1.3);
  const ai = pr(t, FECHO_VOZ + 0.94, 0.12);
  const brilhoAi = Math.max(0, Math.sin(Math.PI * Math.min(1, ai * 1.6))) * 0.9 + ai * 0.15;
  const tl = FECHO_VOZ + 1.25;
  const link = eBack(pr(t, tl, 0.28), 1.6);
  return (
    <>
      <div style={{ position: "absolute", left: 540 - d / 2, top: 900 - d / 2, width: d, height: d, borderRadius: "50%", background: C.papel }} />
      {oa > 0 && <div style={{ position: "absolute", left: 540 - da / 2, top: 900 - da / 2, width: da, height: da, borderRadius: "50%", border: `6px solid ${C.coral}`, boxSizing: "border-box", opacity: oa }} />}
      {t >= ta && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 752, height: 140, display: "flex", justifyContent: "center", alignItems: "center", gap: 28, opacity: pr(t, ta, 0.08), scale: String(0.86 + 0.14 * assina) }}>
          <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 106, lineHeight: 1, color: INK_F, letterSpacing: "-0.035em", translate: "0px 6px" }}>Vai,</span>
          <div style={{ position: "relative", width: 590, height: 116 }}>
            <div style={{ position: "absolute", right: -40, top: -50, width: 230, height: 216, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,100,60,0.38) 0%, rgba(242,100,60,0) 68%)", opacity: brilhoAi }} />
            <Img src={staticFile("marca/logo-ai-tinta.svg")} style={{ position: "absolute", left: 0, top: 0, width: 590 }} />
            <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: 0, top: 0, width: 590, opacity: ai }} />
          </div>
        </div>
      )}
      {t >= tl && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", opacity: pr(t, tl, 0.08) }}>
          <div style={{ scale: String(0.7 + 0.3 * link), background: C.coral, color: "#FFFFFF", borderRadius: 40, padding: "16px 38px", fontFamily: "Sora", fontWeight: 800, fontSize: 34, letterSpacing: "0.06em", boxShadow: "0 10px 26px rgba(221,78,39,0.28)" }}>
            LINK DA BIO
          </div>
        </div>
      )}
    </>
  );
};

// ---------- a frente (tudo o que se mexe; dentro do motion blur) ----------
const Frente: React.FC<{ fr: number }> = ({ fr }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <Gancho t={t} />
      <Abertura t={t} />
      <Trilho t={t} />
      <Motivo1 t={t} />
      <Motivo2 t={t} />
      <Motivo3 t={t} />
      <Celular t={t} fr={fr} />
      <Motivo4 t={t} />
      <Motivo5 t={t} />
      <Chamado t={t} />
    </AbsoluteFill>
  );
};

// ---------- a legenda em blocos: corte seco, sem efeito de chegada; a palavra acende quando é dita ----------
let ctxMede: CanvasRenderingContext2D | null = null;
const mede = (s: string, fonte: string) => {
  if (!ctxMede) ctxMede = document.createElement("canvas").getContext("2d");
  if (!ctxMede) return s.length * 40;
  ctxMede.font = fonte;
  return ctxMede.measureText(s).width;
};
const Legenda: React.FC<{ t: number }> = ({ t }) => {
  const b = BLOCOS.find((x) => t >= x.tin && t < x.fim);
  if (!b) return null;
  const FS = '700 72px "Sora"', FD = 'italic 400 96px "DM Serif Display"';
  const larg = b.ws.reduce((s, w, j) => s + mede(w, j === b.ik ? FD : FS) * (j === b.ik ? 1 : 0.975) + (j > 0 ? 20 : 0) + (j === b.ik ? 26 : 0), 0);
  const k = larg > LARG_LEG ? LARG_LEG / larg : 1;
  const tk = b.chave !== null ? b.chave - 0.03 : 0;
  const pulo = b.chave === null || t < tk ? 0 : t < tk + 0.07 ? pr(t, tk, 0.07) : 1 - pr(t, tk + 0.07, 0.19);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: Y_LEG - 96, height: 120, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, scale: String(k), transformOrigin: "center bottom", textShadow: "0 5px 18px rgba(0,0,0,0.7)" }}>
        {b.ws.map((w, j) => {
          const pw = WORDS[b.idx[j]];
          const op = 0.32 + 0.68 * pr(t, pw.s - 0.06, 0.05);
          const enf = j === b.ik;
          return (
            <span
              key={j}
              style={{
                fontFamily: enf ? "DM Serif Display" : "Sora", fontStyle: enf ? "italic" : "normal", fontWeight: enf ? 400 : 700, fontSize: enf ? 96 : 72,
                letterSpacing: enf ? 0 : "-0.025em", color: enf ? C.coral : C.papel, opacity: op, lineHeight: 1, whiteSpace: "nowrap", margin: enf ? "0 13px" : 0,
                display: "inline-block", scale: enf ? String(1 + 0.06 * pulo) : undefined, translate: enf ? `0px ${-12 * pulo}px` : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// semLegenda: pra capa (no quadro do "5 motivos" a legenda repetiria o "pra ter CNPJ" da cena)
export const CincoMotivos: React.FC<{ semLegenda?: boolean }> = ({ semLegenda }) => {
  pedeFontes();
  const fr = useCurrentFrame();
  const t = fr / FPS;
  const { isRendering } = getRemotionEnvironment();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Fundo t={t} />
      {/* no Studio a frente vai sem o motion blur (a prévia precisa da flag de HTML-in-canvas do Chrome) */}
      {isRendering ? (
        <HtmlInCanvasMotionBlur width={1080} height={1920} samples={8} shutterAngle={200}>
          <Frente fr={fr} />
        </HtmlInCanvasMotionBlur>
      ) : (
        <Frente fr={fr} />
      )}
      {/* o papel do fecho abre fora do motion blur: rápido demais pras 8 amostras, virava anéis */}
      <Fecho t={t} />
      {!semLegenda && <Legenda t={t} />}
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
