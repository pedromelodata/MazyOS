// Elementos 2D do reel de 09/10/2026 ("O sufoco burocrático real"), feitos no kit em 06/10/2026 a pedido do Pedro
// ("anime melhor e exemplifique em animação cada parte da narração, uma a uma"). Mesma linguagem do kit.tsx do reel
// de 02/10: papel, tinta, a escala coral, a sombra SH e a Sora 800. Componentes puros: o movimento vem dos canais
// (st.canais[id], que as batidas p2d-* animam) e o tempo t só move o ambiente (ponteiro dos segundos, pontinhos,
// brilho, estrelas, respiração das pessoas). Nada de texto fixo que apareça: todo texto visível é param da camada
// (a trava de fatos e a de travessão leem os params).
import React from "react";
import { Img, random, staticFile } from "remotion";
import { C, FONT, clamp01, lerp, outBack, outCubic } from "../../../lib/tl";
import { CO, SH } from "../../../motion/kit";

const PI2 = Math.PI * 2;
const inOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const outBounce = (x: number) => {
  const t = clamp01(x);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const u = t - 1.5 / d1;
    return n1 * u * u + 0.75;
  }
  if (t < 2.5 / d1) {
    const u = t - 2.25 / d1;
    return n1 * u * u + 0.9375;
  }
  const u = t - 2.625 / d1;
  return n1 * u * u + 0.984375;
};
/** mistura de duas cores #RRGGBB */
function mix(a: string, b: string, k: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const t = clamp01(k);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
}
/** três paradas (0, 0,5 e 1) */
const mix3 = (a: string, b: string, c: string, k: number) => (k <= 0.5 ? mix(a, b, k * 2) : mix(b, c, (k - 0.5) * 2));
/** ponto no círculo: ângulo 0 às 12h, sentido horário */
const pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
const sombra = (y: number, b: number, a: number) => `drop-shadow(0 ${y}px ${b}px rgba(27,30,36,${a}))`;
const SOMBRA = `${sombra(22, 32, 0.16)} ${sombra(4, 8, 0.08)}`;

// ---------- 1. relógio da tarde: a fatia coral cobre a tarde e os ponteiros correm ----------
export const RelogioTarde: React.FC<{ hora: number; fatia: number; de?: number; ate?: number; d?: number; t: number }> = ({
  hora, fatia, de = 13, ate = 18, d = 560, t,
}) => {
  const cx = 300;
  const cy = 300;
  const a0 = ((de % 12) / 12) * PI2;
  const varre = ((ate - de) / 12) * PI2 * clamp01(fatia);
  const R = 238;
  const [x0, y0] = pol(cx, cy, R, a0);
  const [x1, y1] = pol(cx, cy, R, a0 + varre);
  const fatiaD = varre > 0.002 ? `M${cx} ${cy} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${varre > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z` : "";
  const aH = ((hora % 12) / 12) * PI2;
  const aM = (hora % 1) * PI2;
  const seg = Math.floor(t);
  const aS = ((seg + outBack(clamp01((t - seg) / 0.16), 2.6)) / 60) * PI2;
  const [sx, sy] = pol(cx, cy, 168, a0 + varre * 0.98);
  const solK = clamp01((fatia - 0.02) / 0.08);
  const ponteiro = (a: number, r: number, cauda: number, cor: string, larg: number) => {
    const [px, py] = pol(cx, cy, r, a);
    const [qx, qy] = pol(cx, cy, -cauda, a);
    return <line x1={qx} y1={qy} x2={px} y2={py} stroke={cor} strokeWidth={larg} strokeLinecap="round" />;
  };
  return (
    <svg width={d} height={d} viewBox="0 0 600 600" style={{ overflow: "visible", filter: SOMBRA }}>
      <circle cx={cx} cy={cy} r={290} fill={C.ink} />
      <circle cx={cx} cy={cy} r={266} fill={C.white} />
      {fatiaD ? <path d={fatiaD} fill={C.coral} /> : null}
      {Array.from({ length: 60 }).map((_, k) => {
        const a = (k / 60) * PI2;
        const hora5 = k % 5 === 0;
        const forte = k % 15 === 0;
        const [ax, ay] = pol(cx, cy, forte ? 206 : hora5 ? 218 : 236, a);
        const [bx, by] = pol(cx, cy, 250, a);
        const dentro = varre > 0.002 && ((a - a0 + PI2) % PI2) <= varre + 1e-6;
        const cor = dentro ? (hora5 ? C.white : "rgba(255,255,255,0.55)") : hora5 ? C.ink : "#D9D3CA";
        return <line key={k} x1={ax} y1={ay} x2={bx} y2={by} stroke={cor} strokeWidth={forte ? 14 : hora5 ? 10 : 4} strokeLinecap="round" />;
      })}
      {solK > 0 ? (
        <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)}) rotate(${(t * 40).toFixed(1)})`} opacity={solK}>
          {Array.from({ length: 8 }).map((_, k) => (
            <line key={k} x1={0} y1={-30} x2={0} y2={-44} stroke={C.white} strokeWidth={7} strokeLinecap="round" transform={`rotate(${k * 45})`} />
          ))}
          <circle r={22} fill={C.white} />
        </g>
      ) : null}
      {ponteiro(aH, 132, 24, C.ink, 22)}
      {ponteiro(aM, 198, 30, C.ink, 13)}
      {ponteiro(aS, 214, 44, C.coral6, 5)}
      <circle cx={cx} cy={cy} r={20} fill={C.ink} />
      <circle cx={cx} cy={cy} r={8} fill={C.coral6} />
    </svg>
  );
};

// ---------- 2. bilhete: a "coisa simples", com a caixinha que tenta marcar ----------
export const Bilhete: React.FC<{ marca: number; w?: number }> = ({ marca, w = 300 }) => {
  const m = clamp01(marca);
  return (
    <svg width={w} height={w} viewBox="0 0 300 300" style={{ overflow: "visible", filter: `${sombra(16, 22, 0.16)} ${sombra(3, 6, 0.08)}` }}>
      <path d="M6 10 H294 V236 Q294 294 236 294 H6 Z" fill={CO.c100} />
      <path d="M294 236 Q294 294 236 294 Q256 258 294 236 Z" fill={CO.c200} />
      <rect x={96} y={-12} width={112} height={38} rx={6} fill="rgba(255,255,255,0.75)" transform="rotate(-5 150 8)" />
      <rect x={34} y={102} width={96} height={96} rx={24} fill={C.white} stroke={C.ink} strokeWidth={8} />
      <path d="M56 152 L77 173 L110 128" stroke={C.coral6} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - m} opacity={m > 0.001 ? 1 : 0} />
      <rect x={154} y={122} width={110} height={18} rx={9} fill="rgba(27,30,36,0.24)" />
      <rect x={154} y={160} width={76} height={18} rx={9} fill="rgba(27,30,36,0.14)" />
    </svg>
  );
};

// ---------- 3. navegador: carrega, empaca e trava (congela, falha e o alerta) ----------
export const Navegador: React.FC<{ carrega: number; gira: number; trava: number; falha: number; t: number; w?: number; uid: string }> = ({
  carrega, gira, trava, falha, t, w = 760, uid,
}) => {
  const W = 760;
  const H = 600;
  const tr = clamp01(trava);
  const f = clamp01(falha);
  const parado = tr > 0.02;
  const corGira = parado ? mix("#F2643C", "#CBC5BC", tr) : C.coral;
  const faixa = ((t * 0.8) % 1) * 1400 - 400;
  const cid = (s: string) => `${uid}-${s}`;
  const pagina = (
    <g>
      <rect x={0} y={0} width={W} height={H} rx={36} fill={C.white} />
      <path d={`M0 36 a36 36 0 0 1 36 -36 H${W - 36} a36 36 0 0 1 36 36 V78 H0 Z`} fill={C.alt} />
      <circle cx={40} cy={39} r={10} fill={C.coral} />
      <circle cx={72} cy={39} r={10} fill="#F5A184" />
      <circle cx={104} cy={39} r={10} fill="#CBC5BC" />
      <rect x={142} y={20} width={560} height={38} rx={19} fill={C.white} stroke={C.hair} strokeWidth={2} />
      <rect x={172} y={34} width={250} height={10} rx={5} fill={C.hair} />
      <rect x={0} y={78} width={W} height={8} fill={C.hair} />
      <rect x={0} y={78} width={W * clamp01(carrega)} height={8} fill={corGira} />
      <rect x={40} y={118} width={680} height={224} rx={26} fill={C.alt} />
      <circle cx={380} cy={230} r={50} fill="none" stroke={C.hair} strokeWidth={13} />
      <circle cx={380} cy={230} r={50} fill="none" stroke={corGira} strokeWidth={13} strokeLinecap="round" strokeDasharray="96 220" transform={`rotate(${(gira * 360).toFixed(2)} 380 230)`} />
      <rect x={40} y={374} width={520} height={22} rx={11} fill={C.alt} />
      <rect x={40} y={412} width={620} height={22} rx={11} fill={C.alt} />
      <rect x={40} y={450} width={420} height={22} rx={11} fill={C.alt} />
      <rect x={40} y={502} width={322} height={66} rx={18} fill={C.alt} />
      <rect x={398} y={502} width={322} height={66} rx={18} fill={C.alt} />
      {!parado ? (
        <g clipPath={`url(#${cid("card")})`}>
          <rect x={faixa} y={86} width={150} height={H - 86} fill={`url(#${cid("brilho")})`} transform="skewX(-18)" />
        </g>
      ) : null}
    </g>
  );
  const fatias: Array<[number, number, number]> = [[86, 236, 22], [236, 392, -30], [392, 600, 14]];
  const racha = ["M380 230 L452 168 L520 176 L596 112", "M380 230 L318 300 L332 360 L270 430", "M380 230 L470 286 L560 300", "M380 230 L300 176 L236 190 L170 140"];
  const alerta = outBack(clamp01((tr - 0.25) / 0.45), 2.4);
  return (
    <svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", filter: SOMBRA }}>
      <defs>
        <clipPath id={cid("card")}>
          <rect x={0} y={0} width={W} height={H} rx={36} />
        </clipPath>
        <linearGradient id={cid("brilho")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {fatias.map(([a, b], i) => (
          <clipPath key={i} id={cid(`f${i}`)}>
            <rect x={-60} y={a} width={W + 120} height={b - a} />
          </clipPath>
        ))}
      </defs>
      {f > 0.001 ? (
        <g>
          <g clipPath={`url(#${cid("card")})`}>
            <rect x={0} y={0} width={W} height={H} fill={C.white} />
          </g>
          <g opacity={0.35 * f} transform={`translate(${(10 * f).toFixed(2)} 0)`} style={{ mixBlendMode: "multiply" }}>
            <rect x={0} y={86} width={W} height={H - 86} rx={30} fill={CO.c200} />
          </g>
          {fatias.map(([, , dx], i) => (
            <g key={i} clipPath={`url(#${cid(`f${i}`)})`} transform={`translate(${(dx * f).toFixed(2)} 0)`}>
              {pagina}
            </g>
          ))}
        </g>
      ) : (
        pagina
      )}
      {tr > 0.001 ? (
        <g clipPath={`url(#${cid("card")})`}>
          <rect x={0} y={86} width={W} height={H - 86} fill="#EEF1F4" opacity={0.42 * tr} />
          {racha.map((dd, i) => (
            <path key={i} d={dd} stroke="rgba(27,30,36,0.5)" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(tr * 1.4 - i * 0.12)} />
          ))}
        </g>
      ) : null}
      {alerta > 0.001 ? (
        <g transform={`translate(668 136) scale(${alerta.toFixed(4)})`}>
          <circle r={46} fill={C.coral6} />
          <rect x={-7} y={-28} width={14} height={34} rx={7} fill={C.white} />
          <circle cx={0} cy={20} r={8} fill={C.white} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- 4. cursor: seta (navegador) ou toque (celular), com o aperto e a onda do clique ----------
export const Cursor: React.FC<{ aperta: number; onda: number; tipo?: string }> = ({ aperta, onda, tipo = "seta" }) => {
  const k = 1 - 0.16 * clamp01(aperta);
  const o = clamp01(onda);
  const seta = tipo !== "toque";
  return (
    <svg width={240} height={240} viewBox="0 0 240 240" style={{ overflow: "visible" }}>
      {o > 0.001 && o < 0.999 ? (
        <circle cx={120} cy={120} r={lerp(16, 84, outCubic(o))} fill="none" stroke={seta ? C.coral : C.white} strokeWidth={lerp(12, 2, o)} opacity={1 - o} />
      ) : null}
      <g transform={`translate(120 120) scale(${k.toFixed(4)})`} style={{ filter: sombra(8, 10, 0.3) }}>
        {seta ? (
          <path d="M0 0 L0 96 L24 73 L41 110 L60 101 L43 65 L74 64 Z" fill={C.white} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        ) : (
          <>
            <circle r={44} fill="rgba(255,255,255,0.35)" />
            <circle r={30} fill={C.white} stroke="rgba(27,30,36,0.25)" strokeWidth={3} />
          </>
        )}
      </g>
    </svg>
  );
};

// ---------- 5. telefone: o fone toca com as ondas e, no "cai", despenca ----------
export const Telefone: React.FC<{ toca: number; cai: number; vibra: number; t: number; w?: number }> = ({ toca, cai, vibra, t, w = 600 }) => {
  const c = clamp01(cai);
  const queda = outBounce(c) * 150;
  const giro = -24 + 34 * outCubic(clamp01(c * 1.4));
  const treme = clamp01(vibra) * 6 * Math.sin(t * PI2 * 15);
  const ondas = clamp01(toca) * (1 - clamp01(c * 4));
  const caiu = c >= 0.5;
  const pop = caiu ? outBack(clamp01((c - 0.5) / 0.22), 2.4) : 1;
  const arco = (r: number, a1: number, a2: number) => {
    const [ax, ay] = pol(300, 300, r, (a1 * Math.PI) / 180);
    const [bx, by] = pol(300, 300, r, (a2 * Math.PI) / 180);
    return `M${ax.toFixed(1)} ${ay.toFixed(1)} A${r} ${r} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`;
  };
  return (
    <svg width={w} height={(w * 820) / 600} viewBox="0 0 600 820" style={{ overflow: "visible" }}>
      {ondas > 0.001
        ? [0, 1, 2].map((i) => {
            const o = ondas * (0.25 + 0.75 * Math.max(0, Math.sin(t * PI2 * 2 - i * 0.95)));
            const r = 214 + i * 54;
            return (
              <g key={i} opacity={o} stroke={C.coral} strokeWidth={15} strokeLinecap="round" fill="none">
                <path d={arco(r, 28, 68)} />
                <path d={arco(r, -68, -28)} />
              </g>
            );
          })
        : null}
      <g transform={`translate(0 ${queda.toFixed(2)}) rotate(${(giro + treme).toFixed(2)} 300 300)`} style={{ filter: SOMBRA }}>
        <path d="M150 318 C 220 262, 380 262, 450 318" stroke={C.coral} strokeWidth={62} fill="none" strokeLinecap="round" />
        <rect x={84} y={300} width={140} height={84} rx={42} fill={C.coral} transform="rotate(-16 154 342)" />
        <rect x={376} y={300} width={140} height={84} rx={42} fill={C.coral} transform="rotate(16 446 342)" />
        <ellipse cx={156} cy={366} rx={44} ry={13} fill={C.coral7} opacity={0.5} transform="rotate(-16 156 366)" />
        <ellipse cx={444} cy={366} rx={44} ry={13} fill={C.coral7} opacity={0.5} transform="rotate(16 444 366)" />
        <path d="M196 290 C 250 262, 350 262, 404 290" stroke="rgba(255,255,255,0.4)" strokeWidth={11} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(300 756) scale(${pop.toFixed(4)})`} style={{ filter: SOMBRA }}>
        <rect x={-160} y={-50} width={320} height={100} rx={50} fill={C.white} />
        {!caiu ? (
          [0, 1, 2].map((k) => {
            const b = Math.max(0, Math.sin(t * PI2 * 1.6 - k * 0.9));
            return <circle key={k} cx={-56 + k * 56} cy={-b * 12} r={14} fill={C.coral} />;
          })
        ) : (
          <g stroke={C.ink} strokeWidth={11} strokeLinecap="round" fill="none">
            <line x1={-96} y1={0} x2={-30} y2={0} />
            <line x1={30} y1={8} x2={96} y2={26} />
            <path d="M-14 -22 L4 -2 L-8 4 L12 26" stroke={C.coral6} strokeWidth={8} strokeLinejoin="round" />
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------- 6. fila: as pessoas esperando e você (coral) chegando no fim ----------
const CORES_FILA = ["#BDB6AC", "#CFC8BE", "#ADA69D", "#C6BFB5", "#B5AEA4", "#D2CBC1", "#A9A298", "#C2BBB1", "#B9B2A8", "#CCC5BB"];
export const Fila: React.FC<{ anda: number; suspira: number; n?: number; passo?: number; t: number; w?: number }> = ({ anda, suspira, n = 9, passo = 122, t, w = 1500 }) => {
  const W = 1500;
  const H = 560;
  const chao = 470;
  const xPorta = 1400;
  const pessoa = (x: number, y: number, cor: string, cab: string, key: string, sy = 1, rot = 0, olhos = false) => (
    <g key={key} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      <ellipse cx={0} cy={chao - y + 2} rx={46} ry={10} fill="rgba(27,30,36,0.10)" />
      <g transform={`rotate(${rot.toFixed(2)} 0 0) scale(1 ${sy.toFixed(4)})`}>
        <path d="M-42 0 V-98 a42 42 0 0 1 84 0 V0 Z" fill={cor} />
        <circle cx={0} cy={-158} r={34} fill={cab} />
        {olhos ? (
          <g fill={C.ink}>
            <circle cx={-11} cy={-160} r={5} />
            <circle cx={13} cy={-160} r={5} />
          </g>
        ) : null}
      </g>
    </g>
  );
  const fila = Array.from({ length: n }).map((_, i) => {
    const x = xPorta - 150 - i * passo;
    const resp = Math.sin(t * PI2 * 0.6 + i * 1.7);
    const cor = CORES_FILA[i % CORES_FILA.length];
    return pessoa(x, chao + resp * 2, cor, mix(cor, "#FFFFFF", 0.18), `p${i}`, 1 + resp * 0.012, Math.sin(t * PI2 * 0.35 + i) * 1.4);
  });
  const alvo = xPorta - 150 - n * passo;
  const a = clamp01(anda);
  const xVc = lerp(-140, alvo, outCubic(a));
  const andando = a > 0 && a < 1;
  const pulo = andando ? -Math.abs(Math.sin(a * Math.PI * 7)) * 18 : 0;
  const sp = clamp01(suspira);
  const sy = 1 - 0.08 * Math.sin(sp * Math.PI);
  const balanco = andando ? Math.sin(a * Math.PI * 7) * 4 : 0;
  return (
    <svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <rect x={-400} y={chao} width={W + 800} height={8} rx={4} fill="#E3DED7" />
      <g>
        <rect x={xPorta - 40} y={60} width={220} height={chao - 60} rx={10} fill="#E9E4DC" />
        <rect x={xPorta - 4} y={170} width={120} height={chao - 170} rx={10} fill={C.ink2} />
        <circle cx={xPorta + 96} cy={330} r={8} fill="#E9E4DC" />
        <rect x={xPorta - 60} y={40} width={260} height={46} rx={14} fill={C.ink} />
        <rect x={xPorta - 30} y={56} width={120} height={14} rx={7} fill="#524E48" />
      </g>
      {fila}
      {pessoa(xVc, chao + pulo, C.coral, "#F47F58", "voce", sy, balanco, true)}
      {sp > 0.05 && sp < 0.98 ? (
        <g opacity={Math.sin(sp * Math.PI)} transform={`translate(${(xVc + 52).toFixed(2)} ${(chao - 236 - sp * 40).toFixed(2)})`}>
          <ellipse cx={0} cy={0} rx={30} ry={20} fill={C.white} stroke="#E3DED7" strokeWidth={3} />
          <ellipse cx={-30} cy={22} rx={12} ry={9} fill={C.white} stroke="#E3DED7" strokeWidth={3} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- 7. entardecer: o sol desce, o céu escurece e as janelas da cidade acendem ----------
type Predio = { x: number; w: number; h: number };
const PREDIOS: Predio[] = [
  { x: -20, w: 170, h: 260 }, { x: 140, w: 130, h: 380 }, { x: 262, w: 190, h: 300 }, { x: 445, w: 150, h: 440 },
  { x: 588, w: 200, h: 330 }, { x: 780, w: 140, h: 400 }, { x: 912, w: 190, h: 280 },
];
export const Entardecer: React.FC<{ sol: number; noite: number; luzes: number; t: number; uid: string }> = ({ sol, noite, luzes, t, uid }) => {
  const nk = clamp01(noite);
  const topo = mix3("#FBE3D6", "#E88A6C", "#15171C", nk);
  const meio = mix3("#FDF0E8", "#F5A184", "#262A33", nk);
  const base = mix3("#FAF8F5", "#FBDDD1", "#3A3036", nk);
  const horizonte = 1500;
  const ySol = lerp(1000, 1640, inOut(clamp01(sol)));
  const corPredio = mix3("#E3DED7", "#B98676", "#0F1115", nk);
  const estrelas = clamp01((nk - 0.62) / 0.3);
  const gid = `${uid}-ceu`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={topo} />
          <stop offset="0.55" stopColor={meio} />
          <stop offset="1" stopColor={base} />
        </linearGradient>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor="#F47F58" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F47F58" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${gid})`} />
      {estrelas > 0
        ? Array.from({ length: 34 }).map((_, i) => {
            const x = random(`est-x${i}`) * 1080;
            const y = 560 + random(`est-y${i}`) * 700;
            const pisca = 0.55 + 0.45 * Math.sin(t * PI2 * (0.6 + random(`est-f${i}`)) + i);
            return <circle key={i} cx={x} cy={y} r={2.5 + random(`est-r${i}`) * 3} fill="#FFFFFF" opacity={estrelas * pisca} />;
          })
        : null}
      <circle cx={540} cy={ySol} r={300} fill={`url(#${uid}-halo)`} opacity={1 - nk * 0.6} />
      <circle cx={540} cy={ySol} r={136} fill={C.coral} />
      <circle cx={540} cy={ySol} r={136} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={18} />
      {PREDIOS.map((p, i) => {
        const topoP = horizonte - p.h;
        const janelas: React.ReactNode[] = [];
        const cols = Math.max(2, Math.floor((p.w - 30) / 42));
        const rows = Math.max(3, Math.floor((p.h - 50) / 58));
        for (let r = 0; r < rows; r++) {
          for (let k = 0; k < cols; k++) {
            const lim = random(`jan-${i}-${r}-${k}`);
            const acesa = clamp01((clamp01(luzes) - lim * 0.85) / 0.15);
            const jx = p.x + 20 + k * ((p.w - 40) / cols) + 4;
            const jy = topoP + 34 + r * 58;
            janelas.push(<rect key={`${r}-${k}`} x={jx} y={jy} width={(p.w - 40) / cols - 12} height={30} rx={5} fill={mix("#FFFFFF", "#FFD3B8", acesa)} opacity={0.08 + 0.92 * acesa} />);
          }
        }
        return (
          <g key={i}>
            <rect x={p.x} y={topoP} width={p.w} height={p.h + 500} rx={14} fill={corPredio} />
            {janelas}
          </g>
        );
      })}
      <rect x={0} y={horizonte} width={1080} height={420} fill={mix3("#E3DED7", "#B07A6B", "#0B0C0F", nk)} />
    </svg>
  );
};

// ---------- 8. empresa: a lojinha, a engrenagem que para, as luzes que apagam e a placa de pausa ----------
const engrenagem = (r: number, dentes: number) => {
  const pts: string[] = [];
  for (let k = 0; k < dentes * 4; k++) {
    const a = (k / (dentes * 4)) * PI2;
    const rr = k % 4 === 1 || k % 4 === 2 ? r : r * 0.78;
    pts.push(`${(Math.sin(a) * rr).toFixed(2)},${(-Math.cos(a) * rr).toFixed(2)}`);
  }
  return pts.join(" ");
};
export const Empresa: React.FC<{ gira: number; luz: number; pausa: number; w?: number }> = ({ gira, luz, pausa, w = 640 }) => {
  const L = clamp01(luz);
  const p = outBack(clamp01(pausa), 2.2);
  const jan = mix("#2E313A", "#FFE3CF", L);
  const g1 = gira * 360;
  return (
    <svg width={w} height={(w * 700) / 640} viewBox="0 0 640 700" style={{ overflow: "visible", filter: SOMBRA }}>
      <g transform={`translate(508 150) rotate(${g1.toFixed(2)})`}>
        <polygon points={engrenagem(96, 12)} fill={C.ink2} />
        <circle r={34} fill="#3A3D44" />
        <circle r={14} fill={C.ink2} />
      </g>
      <g transform={`translate(392 86) rotate(${(-g1 * (96 / 60) + 15).toFixed(2)})`}>
        <polygon points={engrenagem(60, 8)} fill="#8A847B" />
        <circle r={20} fill={C.ink2} />
      </g>
      <rect x={70} y={210} width={500} height={450} rx={24} fill={C.white} />
      <rect x={160} y={126} width={320} height={92} rx={26} fill={C.ink} />
      <circle cx={214} cy={172} r={24} fill={C.coral} />
      <rect x={254} y={152} width={170} height={16} rx={8} fill="#524E48" />
      <rect x={254} y={178} width={120} height={14} rx={7} fill="#3A3D44" />
      {Array.from({ length: 8 }).map((_, k) => {
        const x = 70 + k * 62.5;
        return (
          <g key={k}>
            <rect x={x} y={240} width={62.5} height={58} fill={k % 2 ? C.white : C.coral} />
            <path d={`M${x} 298 a31.25 26 0 0 0 62.5 0 Z`} fill={k % 2 ? C.white : C.coral} />
          </g>
        );
      })}
      <rect x={70} y={236} width={500} height={10} rx={5} fill={C.coral7} />
      {[110, 400].map((x) => (
        <g key={x}>
          <rect x={x} y={360} width={130} height={150} rx={16} fill={jan} />
          {L > 0.02 ? <rect x={x + 10} y={370} width={110} height={56} rx={10} fill="#FFFFFF" opacity={0.35 * L} /> : null}
          <rect x={x + 61} y={360} width={8} height={150} fill={C.white} />
          <rect x={x} y={431} width={130} height={8} fill={C.white} />
        </g>
      ))}
      <rect x={270} y={370} width={100} height={290} rx={16} fill={C.ink2} />
      <circle cx={350} cy={520} r={8} fill={C.white} opacity={0.8} />
      <rect x={40} y={652} width={560} height={14} rx={7} fill="#E3DED7" />
      {p > 0.001 ? (
        <g transform={`translate(320 446) rotate(${(Math.sin(clamp01(pausa) * Math.PI * 3) * 10 * (1 - clamp01(pausa))).toFixed(2)}) scale(${p.toFixed(4)})`}>
          <line x1={-20} y1={-62} x2={0} y2={-92} stroke={C.white} strokeWidth={5} />
          <line x1={20} y1={-62} x2={0} y2={-92} stroke={C.white} strokeWidth={5} />
          <circle r={58} fill={C.coral6} stroke={C.white} strokeWidth={8} />
          <rect x={-24} y={-26} width={16} height={52} rx={6} fill={C.white} />
          <rect x={8} y={-26} width={16} height={52} rx={6} fill={C.white} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- 9. ampulheta: vira e a areia escorre ----------
export const Ampulheta: React.FC<{ vira: number; areia: number; w?: number; uid: string }> = ({ vira, areia, w = 260, uid }) => {
  const v = clamp01(vira);
  const virou = v >= 0.999;
  const ar = clamp01(areia);
  const vidro = "M44 44 H216 Q216 150 140 196 Q130 200 140 204 Q216 250 216 356 H44 Q44 250 120 204 Q130 200 120 196 Q44 150 44 44 Z";
  const cid = `${uid}-vidro`;
  // areia no referencial do objeto: A no bulbo de cima (y 44 a 196), B no de baixo (y 204 a 356)
  const A = virou ? ar : 0;
  const B = 1 - A;
  const hA = 150 * Math.sqrt(A);
  const hB = 150 * Math.sqrt(B);
  return (
    <svg width={w} height={(w * 400) / 260} viewBox="0 0 260 400" style={{ overflow: "visible", filter: SOMBRA }}>
      <defs>
        <clipPath id={cid}>
          <path d={vidro} />
        </clipPath>
      </defs>
      <g transform={`rotate(${(180 * outBack(v, 1.2)).toFixed(2)} 130 200)`}>
        <path d={vidro} fill="rgba(255,255,255,0.75)" />
        <g clipPath={`url(#${cid})`}>
          {A > 0.001 ? <rect x={30} y={44} width={200} height={hA} fill={C.coral} /> : null}
          {B > 0.001 ? (virou ? <rect x={30} y={204} width={200} height={hB} fill={C.coral} /> : <rect x={30} y={356 - hB} width={200} height={hB} fill={C.coral} />) : null}
          {virou && ar > 0.002 && ar < 0.998 ? <rect x={126} y={44 + hA} width={8} height={Math.max(0, 196 - 44 - hA)} fill={C.coral6} /> : null}
        </g>
        <path d={vidro} fill="none" stroke="#CBC5BC" strokeWidth={7} />
        <rect x={10} y={10} width={240} height={36} rx={14} fill={C.ink} />
        <rect x={10} y={354} width={240} height={36} rx={14} fill={C.ink} />
        <rect x={20} y={44} width={16} height={312} rx={8} fill={C.ink2} />
        <rect x={224} y={44} width={16} height={312} rx={8} fill={C.ink2} />
      </g>
    </svg>
  );
};

// ---------- 10. construção: o contorno do celular, os blocos que montam a tela e a tela que acende ----------
type Bloco = { x: number; y: number; w: number; h: number; r: number; cor: string; dx: number; dy: number; rot: number };
const BLOCOS: Bloco[] = [
  { x: 22, y: 22, w: 296, h: 663, r: 46, cor: C.white, dx: 0, dy: -620, rot: 0 },
  { x: 44, y: 76, w: 252, h: 58, r: 18, cor: C.ink, dx: -460, dy: -80, rot: -24 },
  { x: 44, y: 152, w: 252, h: 196, r: 26, cor: C.coral, dx: 470, dy: -160, rot: 20 },
  { x: 44, y: 366, w: 118, h: 118, r: 22, cor: CO.c100, dx: -470, dy: 140, rot: -26 },
  { x: 178, y: 366, w: 118, h: 118, r: 22, cor: C.alt, dx: 470, dy: 200, rot: 24 },
  { x: 44, y: 506, w: 252, h: 30, r: 15, cor: C.alt, dx: -420, dy: 360, rot: -14 },
  { x: 44, y: 552, w: 186, h: 30, r: 15, cor: C.alt, dx: 420, dy: 400, rot: 14 },
  { x: 44, y: 604, w: 252, h: 62, r: 31, cor: C.coral, dx: 0, dy: 560, rot: 0 },
];
export const Construcao: React.FC<{ molde: number; blocos: number; liga: number; w?: number }> = ({ molde, blocos, liga, w = 340 }) => {
  const W = 340;
  const H = 707;
  const k = w / W;
  const lg = clamp01(liga);
  return (
    <div style={{ position: "relative", width: w, height: H * k }}>
      <svg width={w} height={H * k} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={0} y={0} width={W} height={H} rx={58} fill="#0E1014" opacity={lg} style={{ filter: SOMBRA }} />
        {BLOCOS.map((b, i) => {
          const p = clamp01(blocos - i);
          if (p <= 0) return null;
          const e = outBack(p, 1.5);
          const tx = b.dx * (1 - e);
          const ty = b.dy * (1 - e);
          const rot = b.rot * (1 - e);
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          return (
            <g key={i} transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)} ${cx} ${cy})`} opacity={clamp01(p * 4)} style={{ filter: i === 0 ? undefined : sombra(8, 12, 0.14) }}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={b.cor} />
            </g>
          );
        })}
        <rect x={4} y={4} width={W - 8} height={H - 8} rx={56} fill="none" stroke={C.white} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(molde)} opacity={1 - lg} />
      </svg>
      {lg > 0.001 ? (
        <Img src={staticFile("splash.png")} style={{ position: "absolute", left: 12 * k, top: 12 * k, width: (W - 24) * k, height: (H - 24) * k, borderRadius: 48 * k, objectFit: "cover", opacity: lg }} />
      ) : null}
      {lg > 0.001 ? <div style={{ position: "absolute", left: (W / 2 - 48) * k, top: 26 * k, width: 96 * k, height: 28 * k, borderRadius: 14 * k, background: "#0E1014", opacity: lg }} /> : null}
    </div>
  );
};

// ---------- 11. perfil: o botão Seguir que vira Seguindo e o link da bio que acende no toque ----------
export const Perfil: React.FC<{ segue: number; link: number; nome?: string; botao?: string; botaoFeito?: string; linkTexto?: string; w?: number }> = ({
  segue, link, nome = "Legalizaí", botao = "Seguir", botaoFeito = "Seguindo", linkTexto = "link da bio", w = 780,
}) => {
  const sg = clamp01(segue);
  const feito = sg >= 0.5;
  const esc = feito ? lerp(0.9, 1, outBack(clamp01((sg - 0.5) / 0.5), 2.6)) : 1 - 0.07 * Math.sin(clamp01(sg / 0.5) * Math.PI);
  const lk = clamp01(link);
  const aceso = lk >= 0.5;
  const escL = aceso ? lerp(0.92, 1, outBack(clamp01((lk - 0.5) / 0.5), 2.6)) : 1 - 0.07 * Math.sin(clamp01(lk / 0.5) * Math.PI);
  const visto = (cor: string, tam: number) => (
    <svg width={tam} height={tam} viewBox="0 0 40 40">
      <path d="M8 21 L17 30 L33 11" stroke={cor} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <div style={{ width: w, background: C.white, borderRadius: 52, boxShadow: SH, padding: "46px 48px 44px", boxSizing: "border-box", border: `2px solid ${C.hair}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ width: 168, height: 168, borderRadius: "50%", background: CO.c100, display: "flex", alignItems: "center", justifyContent: "center", border: `6px solid ${C.white}`, boxShadow: `0 0 0 5px ${C.coral}` }}>
          <div style={{ width: 98, height: 98, borderRadius: 28, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center" }}>{visto(C.white, 72)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.ink, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{nome}</div>
          <div style={{ marginTop: 18, height: 20, width: "78%", borderRadius: 10, background: C.alt }} />
          <div style={{ marginTop: 12, height: 20, width: "52%", borderRadius: 10, background: C.alt }} />
        </div>
      </div>
      <div
        style={{
          marginTop: 40, height: 112, borderRadius: 56, background: feito ? C.white : C.coral, border: feito ? `6px solid ${C.coral}` : "6px solid transparent",
          boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, scale: `${esc.toFixed(4)}`,
          fontFamily: FONT, fontWeight: 800, fontSize: 46, color: feito ? C.coral6 : C.white, letterSpacing: "-0.02em",
          boxShadow: feito ? "none" : "0 14px 26px rgba(242,100,60,0.32)",
        }}
      >
        {feito ? visto(C.coral6, 48) : null}
        {feito ? botaoFeito : botao}
      </div>
      <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 14, padding: "18px 40px", borderRadius: 999, scale: `${escL.toFixed(4)}`,
            background: aceso ? C.coral : C.tint, border: `3px solid ${aceso ? C.coral : CO.c200}`,
            fontFamily: FONT, fontWeight: 700, fontSize: 38, color: aceso ? C.white : C.coral6,
          }}
        >
          <svg width={40} height={40} viewBox="0 0 40 40" fill="none" stroke={aceso ? C.white : C.coral6} strokeWidth={5} strokeLinecap="round">
            <path d="M17 23 L23 17" />
            <path d="M14 18 l-4 4 a6 6 0 0 0 8.5 8.5 l4 -4" />
            <path d="M26 22 l4 -4 a6 6 0 0 0 -8.5 -8.5 l-4 4" />
          </svg>
          {linkTexto}
        </div>
      </div>
    </div>
  );
};

/** quantos blocos a Construcao tem (o canal blocos vai de 0 a este número) */
export const N_BLOCOS = BLOCOS.length;
